import {
  graphql,
  formatQuery,
  formatPageQuery,
  formatPageQueryWithCount,
  formatMutation,
  formatGQLString,
} from '@openimis/fe-core';

// Dashboards
export function fetchDashboards(params) {
  const query = `
    query AnalyticsDashboards($first: Int, $last: Int, $before: String, $after: String, $orderBy: [String]) {
      analyticsDashboards(
        first: $first, last: $last, before: $before, after: $after, orderBy: $orderBy
      ) {
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            name
            description
            layoutConfig
            isPublic
            isDefault
            createdBy {
              id
              username
            }
            widgets {
              edges {
                node {
                  id
                  widgetType
                  title
                  config
                  position
                  query {
                    id
                    name
                    entityType
                    queryConfig
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  
  return graphql(
    query,
    params,
    'ANALYTICS_DASHBOARDS',
  );
}

export function fetchDashboard(dashboardId) {
  const query = `
    query AnalyticsDashboard($id: ID!) {
      analyticsDashboard(id: $id) {
        id
        name
        description
        layoutConfig
        isPublic
        isDefault
        createdBy {
          id
          username
        }
        widgets {
          edges {
            node {
              id
              widgetType
              title
              config
              position
              query {
                id
                name
                entityType
                queryConfig
              }
            }
          }
        }
      }
    }
  `;
  
  return graphql(
    query,
    { id: dashboardId },
    'ANALYTICS_DASHBOARD',
  );
}

// Queries
export function fetchQueries(params) {
  const query = `
    query AnalyticsQueries($first: Int, $last: Int, $before: String, $after: String, $orderBy: [String], $name_Icontains: String, $entityType: String) {
      analyticsQueries(
        first: $first, last: $last, before: $before, after: $after, orderBy: $orderBy,
        name_Icontains: $name_Icontains, entityType: $entityType
      ) {
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            name
            description
            entityType
            queryConfig
            isPublic
            validityFrom
            createdBy {
              id
              username
            }
          }
        }
      }
    }
  `;

  return graphql(
    query,
    params,
    'ANALYTICS_QUERIES',
  );
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
  
  return graphql(
    query,
    { 
      entityType, 
      queryConfig: JSON.stringify(queryConfig) 
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
  
  return graphql(
    query,
    { entityType },
    'ANALYTICS_ENTITY_FIELDS',
    { entityType }, // Add to meta for reducer
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
  
  return graphql(
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
  const query = `
    query AnalyticsExports($first: Int, $last: Int, $before: String, $after: String, $orderBy: [String]) {
      analyticsExports(
        first: $first, last: $last, before: $before, after: $after, orderBy: $orderBy
      ) {
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            exportFormat
            rowCount
            exportedAt
            exportedBy {
              id
              username
            }
            query {
              id
              name
              entityType
            }
          }
        }
      }
    }
  `;
  
  return graphql(
    query,
    params,
    'ANALYTICS_EXPORTS',
  );
}

// Create/Update mutations
export function createQuery(input) {
  const mutation = `
    mutation CreateAnalyticsQuery($input: AnalyticsQueryInput!) {
      createAnalyticsQuery(input: $input) {
        query {
          id
          name
          description
          entityType
          queryConfig
          isPublic
        }
      }
    }
  `;
  
  return graphql(
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
          id
          name
          description
          entityType
          queryConfig
          isPublic
        }
      }
    }
  `;
  
  return graphql(
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
          id
          name
          description
          layoutConfig
          isPublic
        }
      }
    }
  `;
  
  return graphql(
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