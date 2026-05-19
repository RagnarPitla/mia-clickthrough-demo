/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import type { IGetAllOptions } from '../models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import type { Kzk_bpccatalogs } from '../models/Kzk_bpccatalogsModel';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';

export class Kzk_bpccatalogsService {
  private static readonly dataSourceName = 'kzk_bpccatalogs';
  private static readonly client = getClient(dataSourcesInfo);

  public static async getAll(options?: IGetAllOptions): Promise<IOperationResult<Kzk_bpccatalogs[]>> {
    const result = await Kzk_bpccatalogsService.client.retrieveMultipleRecordsAsync<Kzk_bpccatalogs>(
      Kzk_bpccatalogsService.dataSourceName,
      options
    );
    return result;
  }
}
