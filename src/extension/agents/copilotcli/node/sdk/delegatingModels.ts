/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IInstantiationService } from '../../../../../util/vs/platform/instantiation/common/instantiation';
import { CopilotCLIModelInfo, CopilotCLIModels, ICopilotCLIModels } from '../copilotCli';
import { ICopilotCLISDKSelector } from '../copilotCliSdkSelector';
import { NewSdkCopilotCLIModels } from './copilotcliModels';

/**
 * Delegates to either the old CopilotCLIModels or the new NewSdkCopilotCLIModels
 * based on the ICopilotCLISDKSelector.useGithubCopilotSDK() result.
 */
export class DelegatingCopilotCLIModels implements ICopilotCLIModels {
	declare _serviceBrand: undefined;

	private readonly _oldModels: CopilotCLIModels;
	private readonly _newModels: NewSdkCopilotCLIModels;

	constructor(
		@ICopilotCLISDKSelector private readonly sdkSelector: ICopilotCLISDKSelector,
		@IInstantiationService instantiationService: IInstantiationService,
	) {
		this._oldModels = instantiationService.createInstance(CopilotCLIModels);
		this._newModels = instantiationService.createInstance(NewSdkCopilotCLIModels);
	}

	private async _getService(): Promise<ICopilotCLIModels> {
		const useNewSdk = await this.sdkSelector.useGithubCopilotSDK();
		return useNewSdk ? this._newModels : this._oldModels;
	}

	async resolveModel(modelId: string): Promise<string | undefined> {
		const service = await this._getService();
		return service.resolveModel(modelId);
	}

	async getDefaultModel(): Promise<string | undefined> {
		const service = await this._getService();
		return service.getDefaultModel();
	}

	async setDefaultModel(modelId: string | undefined): Promise<void> {
		const service = await this._getService();
		return service.setDefaultModel(modelId);
	}

	async getModels(): Promise<CopilotCLIModelInfo[]> {
		const service = await this._getService();
		return service.getModels();
	}
}
