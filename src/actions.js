import {
  graphql,
  graphqlWithVariables,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatMutation,
  formatGQLString,
} from '@openimis/fe-core';

// Dashboards
export function fetchDashboards(params) {
  const payload = formatPageQueryWithCount('analyticsDashboards', params || [], [
    'id', 'name', 'description', 'layoutConfig', 'isPublic', 'isDefault',
    'createdBy { id username }',
    'widgets { edges { node { id widgetType title config position query { id name entityType queryConfig } } } }',
  ]);
  return graphql(payload, 'ANALYTICS_DASHBOARDS');
}

export function fetchDashboard(dashboardId) {
  const payload = formatQuery('analyticsDashboard', [`id: "${dashboardId}"`], [
    'id', 'name', 'description', 'layoutConfig', 'isPublic', 'isDefault',
    'createdBy { id username }',
    'widgets { edges { node { id widgetType title config position query { id name entityType queryConfig } } } }',
  ]);
  return graphql(payload, 'ANALYTICS_DASHBOARD');
}

// Queries
export function fetchQueries(params) {
  const payload = formatPageQueryWithCount('analyticsQueries', params || [], [
    'id', 'name', 'description', 'entityType', 'queryConfig', 'isPublic', 'validityFrom',
    'createdBy { id username }',
  ]);
  return graphql(payload, 'ANALYTICS_QUERIES');
}

// Execute query
export function executeQuery(entityType, queryConfig) {
  const query = `
    query ExecuteAnalyticsQuery($entityType: String!, $queryConfig: JSONString!) {
      executeAnalyticsQuery(entityType: $entityType, queryConfig: $queryConfig) {
        data
        rowCount
        executionTime
      }
    }
  `;

  return graphqlWithVariables(
    query,
    {
      entityType,
      queryConfig: JSON.stringify(queryConfig),
    },
    'ANALYTICS_EXECUTE_QUERY',
  );
}

// Entity fields
export function fetchEntityFields(entityType) {
  const query = `
    query AnalyticsEntityFields($entityType: String!) {
      analyticsEntityFields(entityType: $entityType) {
        name
        type
        label
        filterable
        aggregatable
      }
    }
  `;

  return graphqlWithVariables(
    query,
    { entityType },
    'ANALYTICS_ENTITY_FIELDS',
  );
}

// Export
export function exportData(entityType, queryConfig, exportFormat, queryId = null) {
  const mutation = `
    mutation ExportAnalyticsData($entityType: String!, $queryConfig: JSONString!, $exportFormat: String!, $queryId: ID) {
      exportAnalyticsData(
        entityType: $entityType,
        queryConfig: $queryConfig,
        exportFormat: $exportFormat,
        queryId: $queryId
      ) {
        exportUrl
        exportId
      }
    }
  `;

  return graphqlWithVariables(
    mutation,
    {
      entityType,
      queryConfig: JSON.stringify(queryConfig),
      exportFormat,
      queryId,
    },
    'ANALYTICS_EXPORT',
  );
}

// Export history
export function fetchExports(params) {
  const payload = formatPageQueryWithCount('analyticsExports', params || [], [
    'id', 'exportFormat', 'rowCount', 'exportedAt',
    'exportedBy { id username }',
    'query { id name entityType }',
  ]);
  return graphql(payload, 'ANALYTICS_EXPORTS');
}

// Create/Update mutations
export function createQuery(input) {
  const mutation = `
    mutation CreateAnalyticsQuery($input: AnalyticsQueryInput!) {
      createAnalyticsQuery(input: $input) {
        query {
          id name description entityType queryConfig isPublic
        }
      }
    }
  `;

  return graphqlWithVariables(
    mutation,
    { input },
    'ANALYTICS_CREATE_QUERY',
  );
}

export function updateQuery(id, input) {
  const mutation = `
    mutation UpdateAnalyticsQuery($id: ID!, $input: AnalyticsQueryInput!) {
      updateAnalyticsQuery(id: $id, input: $input) {
        query {
          id name description entityType queryConfig isPublic
        }
      }
    }
  `;

  return graphqlWithVariables(
    mutation,
    { id, input },
    'ANALYTICS_UPDATE_QUERY',
  );
}

export function createDashboard(input) {
  const mutation = `
    mutation CreateAnalyticsDashboard($input: AnalyticsDashboardInput!) {
      createAnalyticsDashboard(input: $input) {
        dashboard {
          id name description layoutConfig isPublic
        }
      }
    }
  `;

  return graphqlWithVariables(
    mutation,
    { input },
    'ANALYTICS_CREATE_DASHBOARD',
  );
}

// Clear actions
export function clearQueryResults() {
  return { type: 'ANALYTICS_CLEAR_QUERY_RESULTS' };
}

export function clearExport() {
  return { type: 'ANALYTICS_CLEAR_EXPORT' };
}
