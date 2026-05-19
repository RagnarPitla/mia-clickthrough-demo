/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

export interface Kzk_bpccatalogsBase {
  kzk_bpccatalogid: string;
  kzk_catalogcode?: string;
  kzk_name: string;
  kzk_parentcode?: string;
  kzk_itemtype?: string;
  kzk_itemdescription?: string;
  kzk_relatedmodules?: string;
  kzk_areas?: string;
}

export interface Kzk_bpccatalogs extends Kzk_bpccatalogsBase {
  createdon?: string;
  modifiedon?: string;
}
