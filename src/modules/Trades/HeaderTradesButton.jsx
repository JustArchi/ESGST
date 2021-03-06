import { Module } from '../../class/Module';
import { Shared } from '../../class/Shared';
import { DOM } from '../../class/DOM';

class TradesHeaderTradesButton extends Module {
	constructor() {
		super();
		this.info = {
			description: () => (
				<ul>
					<li>Brings back the Trades button to the SteamGifts header.</li>
				</ul>
			),
			id: 'htb',
			name: 'Header Trades Button',
			sg: true,
			type: 'trades',
		};
	}

	init() {
		const tradesButton = Shared.header.addButtonContainer({
			buttonName: 'Trades',
			position: 'beforeend',
			openInNewTab: true,
			side: 'left',
			url: 'https://www.steamtrades.com',
		});
		Shared.header.nodes.leftNav.insertBefore(
			tradesButton.nodes.outer,
			Shared.header.buttonContainers.discussions.nodes.outer
		);
	}
}

const tradesHeaderTradesButton = new TradesHeaderTradesButton();

export { tradesHeaderTradesButton };
