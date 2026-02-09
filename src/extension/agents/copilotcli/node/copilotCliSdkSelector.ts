/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConfigKey, IConfigurationService } from '../../../../platform/configuration/common/configurationService';
import { ILogService } from '../../../../platform/log/common/logService';
import { createServiceIdentifier } from '../../../../util/common/services';

export interface ICopilotCLISDKSelector {
	readonly _serviceBrand: undefined;
	useGithubCopilotSDK(): Promise<boolean>;
}

export const ICopilotCLISDKSelector = createServiceIdentifier<ICopilotCLISDKSelector>('ICopilotCLISDKSelector');

export class CopilotCLISDKSelector implements ICopilotCLISDKSelector {
	declare _serviceBrand: undefined;

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@ILogService private readonly logService: ILogService,
	) { }

	async useGithubCopilotSDK(): Promise<boolean> {
		const enabled = this.configurationService.getConfig(ConfigKey.Advanced.CLINewSdkEnabled) ?? false;
		this.logService.trace(`[CopilotCLISDKSelector] New SDK enabled: ${enabled}`);
		return enabled;
	}
}
