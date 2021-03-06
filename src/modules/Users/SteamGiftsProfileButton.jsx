import { Module } from '../../class/Module';
import { common } from '../Common';
import { Shared } from '../../class/Shared';
import { DOM } from '../../class/DOM';

const createElements = common.createElements.bind(common),
	getFeatureTooltip = common.getFeatureTooltip.bind(common);
class UsersSteamGiftsProfileButton extends Module {
	constructor() {
		super();
		this.info = {
			description: () => (
				<ul>
					<li>
						Adds a button next to the "Visit Steam Profile" button of a user's{' '}
						<a href="https://www.steamtrades.com/user/76561198020696458">profile</a> page that
						allows you to go to their SteamGifts profile page.
					</li>
				</ul>
			),
			id: 'sgpb',
			name: 'SteamGifts Profile Button',
			st: true,
			type: 'users',
		};
	}

	init() {
		if (!Shared.esgst.userPath) return;
		Shared.esgst.profileFeatures.push(this.sgpb_add.bind(this));
	}

	sgpb_add(profile) {
		let button;
		button = createElements(profile.steamButtonContainer, 'beforeend', [
			{
				attributes: {
					class: 'esgst-sgpb-container',
					title: getFeatureTooltip('sgpb'),
				},
				type: 'div',
				children: [
					{
						attributes: {
							class: 'esgst-sgpb-button',
							href: `https://www.steamgifts.com/go/user/${profile.steamId}`,
							rel: 'nofollow',
							target: '_blank',
						},
						type: 'a',
						children: [
							{
								attributes: {
									class: 'fa',
								},
								type: 'i',
								children: [
									{
										attributes: {
											src: Shared.esgst.sgIcon,
										},
										type: 'img',
									},
								],
							},
							{
								text: 'Visit SteamGifts Profile',
								type: 'span',
							},
						],
					},
				],
			},
		]);
		button.insertBefore(profile.steamButton, button.firstElementChild);
	}
}

const usersSteamGiftsProfileButton = new UsersSteamGiftsProfileButton();

export { usersSteamGiftsProfileButton };
