import { Button } from '../../class/Button';
import { DOM } from '../../class/DOM';
import { FetchRequest } from '../../class/FetchRequest';
import { Module } from '../../class/Module';
import { Session } from '../../class/Session';
import { Settings } from '../../class/Settings';

class DiscussionsCloseOpenDiscussionButton extends Module {
	constructor() {
		super();
		this.info = {
			description: () => (
				<ul>
					<li>
						Adds a button (<i className="fa fa-lock"></i> if the discussion is open and{' '}
						<i className="fa fa-lock esgst-red"></i> if it is closed) next to the title of a
						discussion created by yourself (in any{' '}
						<a href="https://www.steamgifts.com/discussions">discussions</a> page) that allows you
						to close/open the discussion without having to access it.
					</li>
				</ul>
			),
			id: 'codb',
			name: 'Close/Open Discussion Button',
			sg: true,
			type: 'discussions',
			featureMap: {
				discussion: this.codb_addButtons.bind(this),
			},
		};
	}

	codb_addButtons(discussions) {
		for (const discussion of discussions) {
			if (
				discussion.author === Settings.get('username') &&
				!discussion.heading.parentElement.getElementsByClassName('esgst-codb-button')[0]
			) {
				if (discussion.closed) {
					discussion.closed.remove();
					discussion.closed = true;
				}
				new Button(discussion.headingContainer.firstElementChild, 'beforebegin', {
					callbacks: [
						this.codb_close.bind(this, discussion),
						null,
						this.codb_open.bind(this, discussion),
						null,
					],
					className: 'esgst-codb-button',
					icons: [
						'fa-lock esgst-clickable',
						'fa-circle-o-notch fa-spin',
						'fa-lock esgst-clickable esgst-red',
						'fa-circle-o-notch fa-spin',
					],
					id: 'codb',
					index: discussion.closed ? 2 : 0,
					titles: [
						'Close discussion',
						'Closing discussion...',
						'Open discussion',
						'Opening discussion...',
					],
				});
			}
		}
	}

	async codb_close(discussion) {
		let response = await FetchRequest.post(discussion.url, {
			data: `xsrf_token=${Session.xsrfToken}&do=close_discussion`,
		});
		if (response.html.getElementsByClassName('page__heading__button--red')[0]) {
			discussion.closed = true;
			discussion.innerWrap.classList.add('is-faded');
			return true;
		}
		return false;
	}

	async codb_open(discussion) {
		let response = await FetchRequest.post(discussion.url, {
			data: `xsrf_token=${Session.xsrfToken}&do=reopen_discussion`,
		});
		if (!response.html.getElementsByClassName('page__heading__button--red')[0]) {
			discussion.closed = false;
			discussion.innerWrap.classList.remove('is-faded');
			return true;
		}
		return false;
	}
}

const discussionsCloseOpenDiscussionButton = new DiscussionsCloseOpenDiscussionButton();

export { discussionsCloseOpenDiscussionButton };
