import {
  graphql,
  graphqlWithVariables,
  formatQuery,
  formatPageQueryWithCount,
} from '@openimis/fe-core';

// `params` of the list fetches are arrays of GraphQL argument strings (see pageArgs).

// Dashboards
export function fetchDashboards(params) {
  const payload = formatPageQueryWithCount('analyticsDashboards', params || [], [
    'id', 'name', 'description', 'layoutConfig', 'isPublic', 'isDefault', 'canEdit',
    'createdBy { id username }',
    'widgets { edges { node { id widgetType title config position query { id name entityType queryConfig } } } }',
  ]);
  return graphql(payload, 'ANALYTICS_DASHBOARDS');
}

export function fetchDashboard(dashboardId) {
  // Dashboards are exposed through Graphene-Django's Relay connection, so `id` comes back
  // as a global base64 ID. The underlying `analyticsDashboard(id)` resolver does
  // `objects.get(pk=id)` which expects a raw UUID — decode before dispatching.
  let resolvedId = dashboardId;
  if (typeof dashboardId === 'string' && !/^[0-9a-f-]{36}$/i.test(dashboardId)) {
    try {
      const decoded = atob(dashboardId);
      const parts = decoded.split(':');
      if (parts.length >= 2) resolvedId = parts[parts.length - 1];
    } catch (e) {
      // Leave as-is if decoding fails — the server error will surface in the UI.
    }
  }
  const payload = formatQuery('analyticsDashboard', [`id: "${resolvedId}"`], [
    'id', 'name', 'description', 'layoutConfig', 'isPublic', 'isDefault', 'canEdit',
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
        truncated
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

// Data of a dashboard widget, readable with the dashboards right alone.
export function executeWidget(widgetId) {
  const query = `
    query ExecuteAnalyticsWidget($widgetId: ID!) {
      executeAnalyticsWidget(widgetId: $widgetId) {
        data
        rowCount
        truncated
        executionTime
      }
    }
  `;

  return graphqlWithVariables(query, { widgetId }, 'ANALYTICS_EXECUTE_WIDGET', { widgetId });
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
    // 4th arg lands on action.meta — the reducer keys entityFields by
    // action.meta.entityType (the GQL response does not echo it back).
    { entityType },
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
        rowCount
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

export function deleteQuery(id) {
  const mutation = `
    mutation DeleteAnalyticsQuery($id: ID!) {
      deleteAnalyticsQuery(id: $id) {
        success
      }
    }
  `;

  return graphqlWithVariables(mutation, { id }, 'ANALYTICS_DELETE_QUERY');
}

export function updateDashboardLayout(dashboardId, positions) {
  const mutation = `
    mutation UpdateAnalyticsDashboardLayout($dashboardId: ID!, $positions: JSONString!) {
      updateAnalyticsDashboardLayout(dashboardId: $dashboardId, positions: $positions) {
        dashboard { id }
      }
    }
  `;

  return graphqlWithVariables(
    mutation,
    { dashboardId, positions: JSON.stringify(positions) },
    'ANALYTICS_UPDATE_DASHBOARD_LAYOUT',
  );
}

// Clear actions
export function clearQueryResults() {
  return { type: 'ANALYTICS_CLEAR_QUERY_RESULTS' };
}

export function clearExport() {
  return { type: 'ANALYTICS_CLEAR_EXPORT' };
}
