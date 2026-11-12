import {
  RIGHT_ANALYTICS_VIEW,
  RIGHT_ANALYTICS_CREATE_QUERY,
  RIGHT_ANALYTICS_EXPORT,
  ANALYTICS_DASHBOARD_ROUTE,
  QUERY_BUILDER_ROUTE,
  SAVED_QUERIES_ROUTE,
  EXPORT_HISTORY_ROUTE,
} from '../constants.js';

// Key under which the entries are contributed; the fe-core "menus" configuration places them.
export const ANALYTICS_MAIN_MENU_CONTRIBUTION_KEY = 'analytics.MainMenu';

// Builds one entry of the `analytics.MainMenu` contribution as fe-core reads it: `id` is the
// entry id the fe-core "menus" configuration whitelists, `text` a translation key, `icon` a
// Material Symbols name, `route` has no leading slash and `rights` lists the rights of which
// the user needs one.
export const menuEntry = (id, textKey, icon, route, rights) => ({
  id,
  route,
  text: `analytics.menu.analytics.${textKey}`,
  icon,
  rights,
});

// The id, text, icon and rights of an entry, to spread into the `core.Router`
// entry of the route the menu entry points at.
export const routeProps = (entry) => {
  const { route, ...props } = entry;
  return props;
};

export const dashboardEntry = menuEntry('analytics.dashboard', 'dashboard', 'Dashboard', ANALYTICS_DASHBOARD_ROUTE, [RIGHT_ANALYTICS_VIEW]);
export const queryBuilderEntry = menuEntry('analytics.queryBuilder', 'queryBuilder', 'BarChart', QUERY_BUILDER_ROUTE, [RIGHT_ANALYTICS_CREATE_QUERY]);
export const savedQueriesEntry = menuEntry('analytics.savedQueries', 'savedQueries', 'SaveAlt', SAVED_QUERIES_ROUTE, [RIGHT_ANALYTICS_CREATE_QUERY]);
export const exportHistoryEntry = menuEntry('analytics.exportHistory', 'exportHistory', 'History', EXPORT_HISTORY_ROUTE, [RIGHT_ANALYTICS_EXPORT]);

// Menu order of the contribution.
export const menuEntries = [dashboardEntry, queryBuilderEntry, savedQueriesEntry, exportHistoryEntry];
