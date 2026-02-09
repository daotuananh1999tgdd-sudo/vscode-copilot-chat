/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { SweCustomAgent } from '@github/copilot/sdk';
import type { CancellationToken, Uri } from 'vscode';
import { ILogService } from '../../../../../platform/log/common/logService';
import { Emitter, Event } from '../../../../../util/vs/base/common/event';
import { Disposable, IReference } from '../../../../../util/vs/base/common/lifecycle';
import { IInstantiationService } from '../../../../../util/vs/platform/instantiation/common/instantiation';
import { ICopilotCLISDKSelector } from '../copilotCliSdkSelector';
import { ICopilotCLISession } from '../copilotcliSession';
import { CopilotCLISessionService, ICopilotCLISessionItem, ICopilotCLISessionService } from '../copilotcliSessionService';
import { NewSdkCopilotCLISessionService } from './copilotcliSessionService';

/**
 * Delegates to either the old CopilotCLISessionService or the new NewSdkCopilotCLISessionService
 * based on the ICopilotCLISDKSelector.useGithubCopilotSDK() result.
 */
export class DelegatingCopilotCLISessionService extends Disposable implements ICopilotCLISessionService {
	declare _serviceBrand: undefined;

	private readonly _oldService: CopilotCLISessionService;
	private readonly _newService: NewSdkCopilotCLISessionService;

	private readonly _onDidChangeSessions = this._register(new Emitter<void>());
	public readonly onDidChangeSessions: Event<void> = this._onDidChangeSessions.event;

	constructor(
		@ILogService private readonly logService: ILogService,
		@ICopilotCLISDKSelector private readonly sdkSelector: ICopilotCLISDKSelector,
		@IInstantiationService instantiationService: IInstantiationService,
	) {
		super();

		this._oldService = this._register(instantiationService.createInstance(CopilotCLISessionService));
		this._newService = this._register(instantiationService.createInstance(NewSdkCopilotCLISessionService));

		// Forward change events from both services
		this._register(this._oldService.onDidChangeSessions(() => this._onDidChangeSessions.fire()));
		this._register(this._newService.onDidChangeSessions(() => this._onDidChangeSessions.fire()));
	}

	private async _getService(): Promise<CopilotCLISessionService | NewSdkCopilotCLISessionService> {
		const useNewSdk = await this.sdkSelector.useGithubCopilotSDK();
		return useNewSdk ? this._newService : this._oldService;
	}

	async getSessionWorkingDirectory(sessionId: string, token: CancellationToken): Promise<Uri | undefined> {
		const service = await this._getService();
		return service.getSessionWorkingDirectory(sessionId, token);
	}

	async getAllSessions(filter: (sessionId: string) => boolean | undefined, token: CancellationToken): Promise<readonly ICopilotCLISessionItem[]> {
		const service = await this._getService();
		return service.getAllSessions(filter, token);
	}

	async deleteSession(sessionId: string): Promise<void> {
		const service = await this._getService();
		return service.deleteSession(sessionId);
	}

	async getSession(sessionId: string, options: { model?: string; workingDirectory?: Uri; isolationEnabled?: boolean; readonly: boolean; agent?: SweCustomAgent }, token: CancellationToken): Promise<IReference<ICopilotCLISession> | undefined> {
		const service = await this._getService();
		return service.getSession(sessionId, options, token);
	}

	async createSession(options: { model?: string; workingDirectory?: Uri; isolationEnabled?: boolean; agent?: SweCustomAgent }, token: CancellationToken): Promise<IReference<ICopilotCLISession>> {
		const useNewSdk = await this.sdkSelector.useGithubCopilotSDK();
		this.logService.trace(`[DelegatingSessionService] Creating session with ${useNewSdk ? 'new' : 'old'} SDK`);

		if (useNewSdk) {
			return this._newService.createSession(options, token);
		}
		return this._oldService.createSession(options, token);
	}
}
