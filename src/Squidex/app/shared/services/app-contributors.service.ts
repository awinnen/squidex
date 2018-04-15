/*
 * Squidex Headless CMS
 *
 * @license
 * Copyright (c) Squidex UG (haftungsbeschränkt). All rights reserved.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import '@app/framework/angular/http/http-extensions';

import {
    AnalyticsService,
    ApiUrlConfig,
    HTTP,
    Version,
    Versioned
} from '@app/framework';

export class AppContributorsDto {
    constructor(
        public readonly contributors: AppContributorDto[],
        public readonly maxContributors: number,
        public readonly version: Version
    ) {
    }
}

export class AppContributorDto {
    constructor(
        public readonly contributorId: string,
        public readonly permission: string
    ) {
    }
}

export class ContributorAssignedDto {
    constructor(
        public readonly contributorId: string
    ) {
    }
}

@Injectable()
export class AppContributorsService {
    constructor(
        private readonly http: HttpClient,
        private readonly apiUrl: ApiUrlConfig,
        private readonly analytics: AnalyticsService
    ) {
    }

    public getContributors(appName: string): Observable<AppContributorsDto> {
        const url = this.apiUrl.buildUrl(`api/apps/${appName}/contributors`);

        return HTTP.getVersioned<any>(this.http, url)
                .map(response => {
                    const body = response.payload.body;

                    const items: any[] = body.contributors;

                    return new AppContributorsDto(
                        items.map(item => {
                            return new AppContributorDto(
                                item.contributorId,
                                item.permission);
                        }),
                        body.maxContributors, response.version);
                })
                .pretifyError('Failed to load contributors. Please reload.');
    }

    public postContributor(appName: string, dto: AppContributorDto, version: Version): Observable<Versioned<ContributorAssignedDto>> {
        const url = this.apiUrl.buildUrl(`api/apps/${appName}/contributors`);

        return HTTP.postVersioned(this.http, url, dto, version)
                .map(response => {
                    const body: any = response.payload.body;

                    const result = new ContributorAssignedDto(body.contributorId);

                    return new Versioned(response.version, result);
                })
                .do(() => {
                    this.analytics.trackEvent('Contributor', 'Configured', appName);
                })
                .pretifyError('Failed to add contributors. Please reload.');
    }

    public deleteContributor(appName: string, contributorId: string, version: Version): Observable<Versioned<any>> {
        const url = this.apiUrl.buildUrl(`api/apps/${appName}/contributors/${contributorId}`);

        return HTTP.deleteVersioned(this.http, url, version)
                .do(() => {
                    this.analytics.trackEvent('Contributor', 'Deleted', appName);
                })
                .pretifyError('Failed to delete contributors. Please reload.');
    }
}