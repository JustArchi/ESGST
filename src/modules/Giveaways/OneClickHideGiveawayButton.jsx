import { Button } from '../../class/Button';
import { DOM } from '../../class/DOM';
import { FetchRequest } from '../../class/FetchRequest';
import { Module } from '../../class/Module';
import { Scope } from '../../class/Scope';
import { Session } from '../../class/Session';
import { Settings } from '../../class/Settings';
import { common } from '../Common';

class GiveawaysOneClickHideGiveawayButton extends Module {
	constructor() {
		super();
		this.info = {
			description: () => (
				<ul>
					<li>
						When you click on the icon <i className="fa fa-eye-slash"></i> next to a giveaway's game
						name, the game will be hidden immediately, without any confirmation popup being shown.
					</li>
				</ul>
			),
			features: {
				ochgb_f: {
					description: () => (
						<ul>
							<li>
								With this option enabled, when you hide a game, instead of all of the giveaways for
								the game being removed from the page, they are simply faded out.
							</li>
						</ul>
					),
					name: 'Fade hidden giveaways instead of removing them.',
					sg: true,
				},
			},
			id: 'ochgb',
			name: 'One-Click Hide Giveaway Button',
			sg: true,
			type: 'giveaways',
			featureMap: {
				giveaway: this.ochgb_setButton.bind(this),
			},
		};
	}

	ochgb_setButton(giveaways, main) {
		giveaways.forEach((giveaway) => {
			let button = giveaway.innerWrap.querySelector(`.giveaway__hide, .featured__giveaway__hide`);
			if (!button) return;
			let unhide = button.classList.contains('fa-eye');
			if (this.esgst.giveawayPath && main) {
				button = button.parentElement;
			}
			giveaway.fade = this.ochgb_fadeGiveaway.bind(this, giveaway, main);
			giveaway.unfade = this.ochgb_unfadeGiveaway.bind(this, giveaway, main);
			giveaway.ochgbButton = new Button(button, 'afterend', {
				callbacks: [
					this.ochgb_hideGiveaway.bind(this, giveaway, main),
					null,
					this.ochgb_unhideGiveaway.bind(this, giveaway, main),
					null,
				],
				className: `esgst-ochgb ${this.esgst.giveawayPath && main ? '' : 'giveaway__icon'}`,
				icons: [
					'fa-eye-slash esgst-clickable',
					'fa-circle-o-notch fa-spin',
					'fa-eye esgst-clickable',
					'fa-circle-o-notch fa-spin',
				],
				id: 'ochgb',
				index: unhide ? 2 : 0,
				titles: [
					'Hide all giveaways for this game',
					'Hiding giveaways...',
					'Unhide all giveaways for this game',
					'Unhiding giveaways...',
				],
			});
			giveaway.ochgbButton.button.setAttribute('data-draggable-id', 'hideGame');
			button.remove();
		});
	}

	ochgb_fadeGiveaway(giveaway, main) {
		if ((this.esgst.giveawayPath && !main) || !this.esgst.giveawayPath) {
			giveaway.innerWrap.classList.add('esgst-faded');
		}
	}

	ochgb_unfadeGiveaway(giveaway, main) {
		if ((this.esgst.giveawayPath && !main) || !this.esgst.giveawayPath) {
			giveaway.innerWrap.classList.remove('esgst-faded');
		}
	}

	async ochgb_hideGiveaway(giveaway, main) {
		await FetchRequest.post('/ajax.php', {
			data: `xsrf_token=${Session.xsrfToken}&do=hide_giveaways_by_game_id&game_id=${giveaway.gameId}`,
		});
		this.ochgb_completeProcess(giveaway, 'fade', main);
		await common.updateHiddenGames(giveaway.id, giveaway.type);
		return true;
	}

	async ochgb_unhideGiveaway(giveaway, main) {
		await FetchRequest.post('/ajax.php', {
			data: `xsrf_token=${Session.xsrfToken}&do=remove_filter&game_id=${giveaway.gameId}`,
		});
		this.ochgb_completeProcess(giveaway, 'unfade', main);
		await common.updateHiddenGames(giveaway.id, giveaway.type, true);
		return true;
	}

	ochgb_completeProcess(clickedGiveaway, key, main) {
		if (main && this.esgst.giveawayPath) return;
		const giveaways = Scope.findData('current', 'giveaways');
		if (Settings.get('ochgb_f')) {
			for (const giveaway of giveaways) {
				if (giveaway.gameId === clickedGiveaway.gameId) {
					giveaway[key]();
					if (giveaway !== clickedGiveaway && giveaway.ochgbButton) {
						giveaway.ochgbButton.index = key === 'fade' ? 2 : 0;
						// noinspection JSIgnoredPromiseFromCall
						giveaway.ochgbButton.change();
					}
				}
			}
		} else {
			for (const giveaway of giveaways) {
				if (giveaway.gameId === clickedGiveaway.gameId) {
					giveaway.outerWrap.remove();
				}
			}
		}
	}
}

const giveawaysOneClickHideGiveawayButton = new GiveawaysOneClickHideGiveawayButton();

export { giveawaysOneClickHideGiveawayButton };
