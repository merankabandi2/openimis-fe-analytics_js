import messages_en from './translations/en.json';
import messages_fr from './translations/fr.json';
import reducer from './reducer';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import QueryBuilderPage from './pages/QueryBuilderPage';
import SavedQueriesPage from './pages/SavedQueriesPage';
import ExportHistoryPage from './pages/ExportHistoryPage';
import {
  ANALYTICS_MAIN_MENU_CONTRIBUTION_KEY,
  menuEntries,
  routeProps,
  dashboardEntry,
  queryBuilderEntry,
  savedQueriesEntry,
  exportHistoryEntry,
} from './menu/menuEntry';
import {
  ANALYTICS_DASHBOARD_ROUTE,
  QUERY_BUILDER_ROUTE,
  SAVED_QUERIES_ROUTE,
  EXPORT_HISTORY_ROUTE,
} from './constants';

const DEFAULT_CONFIG = {
  translations: [
    { key: 'en', messages: messages_en },
    { key: 'fr', messages: messages_fr }
  ],
  reducers: [{ key: 'analytics', reducer }],
  'core.Router': [
    { path: ANALYTICS_DASHBOARD_ROUTE, ...routeProps(dashboardEntry), component: AnalyticsDashboardPage },
    { path: QUERY_BUILDER_ROUTE, ...routeProps(queryBuilderEntry), component: QueryBuilderPage },
    { path: SAVED_QUERIES_ROUTE, ...routeProps(savedQueriesEntry), component: SavedQueriesPage },
    { path: EXPORT_HISTORY_ROUTE, ...routeProps(exportHistoryEntry), component: ExportHistoryPage },
  ],
  refs: [
    { key: 'analytics.route.dashboard', ref: ANALYTICS_DASHBOARD_ROUTE },
    { key: 'analytics.route.queryBuilder', ref: QUERY_BUILDER_ROUTE },
    { key: 'analytics.route.savedQueries', ref: SAVED_QUERIES_ROUTE },
    { key: 'analytics.route.exportHistory', ref: EXPORT_HISTORY_ROUTE },
  ],
  // The fe-core "menus" configuration places the entries; no top-level descriptor is contributed.
  [ANALYTICS_MAIN_MENU_CONTRIBUTION_KEY]: menuEntries,
};

export const AnalyticsModule = (cfg) => ({ ...DEFAULT_CONFIG, ...(cfg || {}) });