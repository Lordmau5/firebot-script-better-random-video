import {
	Firebot, ScriptModules
} from '@crowbartools/firebot-custom-scripts-types';
import {
	EventSource
} from '@crowbartools/firebot-custom-scripts-types/types/modules/event-manager';
import {
	FirebotSettings
} from '@crowbartools/firebot-custom-scripts-types/types/settings';
import {
	autoload
} from './autoload';
import {
	createVideoManager
} from './video-manager';

const script: Firebot.CustomScript = {
	getScriptManifest: () => {
		return {
			name: 'Better Random Video',
			description: 'A custom script that adds an improved \'Play Random Video\' effect with proper folder randomness and effect output support',
			author: 'Lordmau5',
			version: '1.0.4',
			firebotVersion: '5'
		};
	},
	getDefaultParameters: () => {
		return {
		};
	},
	run: async runRequest => {
		const eventSource: EventSource = {
			id: 'better-random-video',
			name: 'Better Random Video',
			events: []
		};
		autoload(runRequest.modules, eventSource);
		modules = runRequest.modules;
		settings = runRequest.firebot.settings;

		try {
			createVideoManager(modules.path.join(SCRIPTS_DIR, '..', 'db', 'betterRandomVideo.db'), modules);
		}
		catch (error) {
			// eslint-disable-next-line no-debugger
			debugger;
		}
	}
};

export let modules: ScriptModules;

export let settings: FirebotSettings;

export default script;
