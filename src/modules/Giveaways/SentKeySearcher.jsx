import { DOM } from '../../class/DOM';
import { FetchRequest } from '../../class/FetchRequest';
import { Module } from '../../class/Module';
import { Popup } from '../../class/Popup';
import { Session } from '../../class/Session';
import { Settings } from '../../class/Settings';
import { ToggleSwitch } from '../../class/ToggleSwitch';
import { Button } from '../../components/Button';
import { NotificationBar } from '../../components/NotificationBar';
import { common } from '../Common';

const createElements = common.createElements.bind(common),
	createHeadingButton = common.createHeadingButton.bind(common),
	downloadFile = common.downloadFile.bind(common),
	observeChange = common.observeChange.bind(common),
	observeNumChange = common.observeNumChange.bind(common);
class GiveawaysSentKeySearcher extends Module {
	constructor() {
		super();
		this.info = {
			description: () => (
				<ul>
					<li>
						Adds a button (<i className="fa fa-key"></i> <i className="fa fa-search"></i>) to the
						main page heading of your{' '}
						<a href="https://www.steamgifts.com/giveaways/created">created</a> page that allows you
						to search for a key or a set of keys in all of keys that you have ever sent.
					</li>
					<li>
						There is also an option to export all of the keys that you have ever sent to a text
						file.
					</li>
				</ul>
			),
			id: 'sks',
			name: 'Sent Key Searcher',
			sg: true,
			type: 'giveaways',
		};
	}

	init() {
		if (!this.esgst.createdPath) return;
		let button = createHeadingButton({
			id: 'sks',
			icons: ['fa-key', 'fa-search'],
			title: 'Search keys',
		});
		button.addEventListener('click', this.sks_openPopup.bind(this, { button }));
	}

	sks_openPopup(sks) {
		if (sks.popup) {
			sks.popup.open();
			return;
		}
		sks.popup = new Popup({ addScrollable: true, icon: 'fa-key', title: `Search for keys:` });
		sks.textArea = createElements(sks.popup.scrollable, 'beforeend', [
			{
				attributes: {
					class: 'esgst-description',
				},
				text: `Insert the keys below, one per line.`,
				type: 'div',
			},
			{
				type: 'textarea',
			},
		]);
		new ToggleSwitch(
			sks.popup.description,
			'sks_exportKeys',
			false,
			'Export all keys ever sent.',
			false,
			false,
			"This will search all your giveaways and export a file with all keys ever sent. You don't need to enter any keys if this option is enabled.",
			Settings.get('sks_exportKeys')
		);
		let searchCurrent = new ToggleSwitch(
			sks.popup.description,
			'sks_searchCurrent',
			false,
			'Only search the current page.',
			false,
			false,
			null,
			Settings.get('sks_searchCurrent')
		);
		let minDate = new ToggleSwitch(
			sks.popup.description,
			'sks_limitDate',
			false,
			(
				<fragment>
					Limit search by date, from{' '}
					<input
						className="esgst-switch-input esgst-switch-input-large"
						type="date"
						value={Settings.get('sks_minDate')}
					/>
					{' to '}
					<input
						className="esgst-switch-input esgst-switch-input-large"
						type="date"
						value={Settings.get('sks_maxDate')}
					/>
					.
				</fragment>
			),
			false,
			false,
			null,
			Settings.get('sks_limitDate')
		).name.firstElementChild;
		let maxDate = minDate.nextElementSibling;
		let limitPages = new ToggleSwitch(
			sks.popup.description,
			'sks_limitPages',
			false,
			(
				<fragment>
					Limit search by pages, from{' '}
					<input
						className="esgst-switch-input"
						min="1"
						type="number"
						value={Settings.get('sks_minPage')}
					/>
					{' to '}
					<input
						className="esgst-switch-input"
						min="1"
						type="number"
						value={Settings.get('sks_maxPage')}
					/>
					.
				</fragment>
			),
			false,
			false,
			null,
			Settings.get('sks_limitPages')
		);
		let minPage = limitPages.name.firstElementChild;
		let maxPage = minPage.nextElementSibling;
		searchCurrent.exclusions.push(limitPages.container);
		limitPages.exclusions.push(searchCurrent.container);
		if (Settings.get('sks_searchCurrent')) {
			limitPages.container.classList.add('esgst-hidden');
		} else if (Settings.get('sks_limitPages')) {
			searchCurrent.container.classList.add('esgst-hidden');
		}
		observeChange(minDate, 'sks_minDate', true);
		observeChange(maxDate, 'sks_maxDate', true);
		observeNumChange(minPage, 'sks_minPage', true);
		observeNumChange(maxPage, 'sks_maxPage', true);
		sks.results = createElements(sks.popup.scrollable, 'beforeend', [
			{
				type: 'div',
			},
		]);
		Button.create([
			{
				color: 'green',
				icons: ['fa-search'],
				name: 'Search',
				onClick: this.sks_searchGiveaways.bind(this, sks),
			},
			{
				template: 'error',
				name: 'Cancel',
				switchTo: { onReturn: 0 },
				onClick: this.sks_cancelSearch.bind(this, sks),
			},
		]).insert(sks.popup.description, 'beforeend');
		sks.progressBar = NotificationBar.create().insert(sks.popup.description, 'beforeend').hide();
		sks.overallProgressBar = NotificationBar.create()
			.insert(sks.popup.description, 'beforeend')
			.hide();
		sks.popup.open();
	}

	async sks_searchGiveaways(sks) {
		// initialize stuff
		sks.button.classList.add('esgst-busy');
		sks.canceled = false;
		sks.count = 0;
		sks.giveaways = {};
		sks.allKeys = [];
		sks.keys = [];
		sks.progressBar.setLoading(null).show();
		sks.overallProgressBar.reset().show();
		sks.results.innerHTML = '';
		let keys = sks.textArea.value.trim().split(/\n/);
		let n = keys.length;
		if (!Settings.get('sks_exportKeys') && n < 1) {
			return;
		}
		for (let i = 0; i < n; i++) {
			let key = keys[i].trim();
			if (key) {
				sks.keys.push(key);
				sks.count += 1;
			}
		}
		sks.textArea.value = sks.keys.join('\n');

		// search keys
		let [nextPage, maxPage] = Settings.get('sks_limitPages')
			? [Settings.get('sks_minPage'), Settings.get('sks_maxPage') + 1]
			: Settings.get('sks_searchCurrent')
			? [this.esgst.currentPage, this.esgst.currentPage + 1]
			: [this.esgst.currentPage, null];
		let [minDate, maxDate] = Settings.get('sks_limitDate')
			? [
					new Date(Settings.get('sks_minDate')).getTime() - 1,
					new Date(Settings.get('sks_maxDate')).getTime() + 1,
			  ]
			: [null, null];
		let pagination = null;
		let skipped = false;
		let stopped = false;
		do {
			let context = null;
			skipped = false;
			if (nextPage === this.esgst.currentPage) {
				context = document;
				sks.lastPage = this.esgst.modules.generalLastPageLink.lpl_getLastPage(context, true);
				sks.lastPage = maxPage
					? ` of ${maxPage - 1}`
					: sks.lastPage === 999999999
					? ''
					: ` of ${sks.lastPage}`;
			} else if (document.getElementsByClassName(`esgst-es-page-${nextPage}`)[0]) {
				skipped = true;
				continue;
			} else {
				context = (await FetchRequest.get(`/giveaways/created/search?page=${nextPage}`)).html;
				if (!sks.lastPage) {
					sks.lastPage = this.esgst.modules.generalLastPageLink.lpl_getLastPage(context);
					sks.lastPage = maxPage
						? ` of ${maxPage - 1}`
						: sks.lastPage === 999999999
						? ''
						: ` of ${sks.lastPage}`;
				}
			}
			sks.overallProgressBar.setMessage(`Page ${nextPage}${sks.lastPage} (${sks.count} keys left)`);
			let elements = context.getElementsByClassName('trigger-popup--keys');
			for (let i = 0, n = elements.length; !sks.canceled && i < n; i++) {
				sks.progressBar.setMessage(`Retrieving keys (${i + 1} of ${n})...`);
				let element = elements[i];
				let endDate =
					parseInt(
						element
							.closest('.table__row-inner-wrap')
							.querySelector(`[data-timestamp]`)
							.getAttribute('data-timestamp')
					) * 1e3;
				if (minDate && maxDate) {
					if (endDate > maxDate) {
						skipped = true;
						continue;
					}
					if (endDate < minDate) {
						stopped = true;
						continue;
					}
				}
				let giveaway = {
					active: Date.now() < endDate,
					code: element.parentElement.querySelector(`[name=code]`).value,
					name: element.getAttribute('data-name'),
				};
				let heading = DOM.parse(
					(
						await FetchRequest.post('/ajax.php', {
							data: `xsrf_token=${Session.xsrfToken}&do=popup_keys&code=${giveaway.code}`,
						})
					).json.html
				).getElementsByClassName('popup__keys__heading')[0];
				if (!heading || (heading.textContent !== 'Assigned' && !giveaway.active)) {
					continue;
				}
				let keys = heading.nextElementSibling.nextElementSibling.children;
				for (let j = keys.length - 1; !sks.canceled && j > -1; j--) {
					let key = keys[j].textContent;
					if (sks.keys.indexOf(key) > -1) {
						sks.giveaways[key] = giveaway;
						sks.count -= 1;
					}
					if (Settings.get('sks_exportKeys')) {
						sks.allKeys.push(
							`${giveaway.active ? 'UNASSIGNED ' : 'ASSIGNED'},"${key.replace(
								/"/g,
								'""'
							)}","${giveaway.name.replace(/"/g, '""')}",https://www.steamgifts.com/giveaway/${
								giveaway.code
							}/`
						);
					}
				}
			}
			nextPage += 1;
			pagination =
				sks.count > 0 || Settings.get('sks_exportKeys')
					? context.getElementsByClassName('pagination__navigation')[0]
					: null;
		} while (
			!sks.canceled &&
			!stopped &&
			(!maxPage || nextPage < maxPage) &&
			(skipped || (pagination && !pagination.lastElementChild.classList.contains('is-selected')))
		);

		if (sks.canceled) {
			// search has been canceled
			return;
		}

		// finish the search
		let found = [];
		let notFound = [];
		for (let i = 0, n = sks.keys.length; i < n; i++) {
			let key = sks.keys[i];
			let giveaway = sks.giveaways[key];
			if (giveaway) {
				found.push({
					type: 'li',
					children: [
						{
							text: `${giveaway.active ? `[UNASSIGNED] ` : ''}${key} (`,
							type: 'node',
						},
						{
							attributes: {
								href: `/giveaway/${giveaway.code}/`,
							},
							text: giveaway.name,
							type: 'a',
						},
						{
							text: `)`,
							type: 'node',
						},
					],
				});
			} else {
				notFound.push({
					text: key,
					type: 'li',
				});
			}
		}
		const items = [
			{ array: found, name: 'Found' },
			{ array: notFound, name: 'Did not find' },
		];
		for (const item of items) {
			let n = item.array.length;
			if (n < 1) {
				continue;
			}
			createElements(sks.results, 'beforeend', [
				{
					attributes: {
						class: 'markdown',
					},
					type: 'div',
					children: [
						{
							type: 'div',
							children: [
								{
									attributes: {
										class: 'esgst-bold',
									},
									text: `${item.name} ${n} keys:`,
									type: 'span',
								},
							],
						},
						{
							type: 'ul',
							children: item.array,
						},
					],
				},
			]);
		}
		if (Settings.get('sks_exportKeys')) {
			downloadFile(sks.allKeys.join('\r\n'), `esgst_sks_keys_${new Date().toISOString()}.csv`);
		}
		sks.progressBar.reset().hide();
		if (sks.count > 0) {
			sks.overallProgressBar.setWarning(`${sks.count} keys were not found.`);
		} else {
			sks.overallProgressBar.setSuccess('All keys were found!');
		}
		sks.button.classList.remove('esgst-busy');
	}

	sks_cancelSearch(sks) {
		sks.canceled = true;
		sks.button.classList.remove('esgst-busy');
		sks.progressBar.reset().hide();
	}
}

const giveawaysSentKeySearcher = new GiveawaysSentKeySearcher();

export { giveawaysSentKeySearcher };
