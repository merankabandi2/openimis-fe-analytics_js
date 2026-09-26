import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Fab,
  Menu,
  MenuItem,
  IconButton,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Dashboard as DashboardIcon,
} from '@material-ui/icons';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useTranslations, useModulesManager, Helmet } from '@openimis/fe-core';
import {
  fetchDashboards, fetchDashboard, executeWidget, updateDashboardLayout,
} from '../actions';
import {
  graphqlErrorMessage, hasRight, layoutPositions, localiseError, pageArgs, parseJson, requestErrorMessage,
  widgetLayout,
} from '../utils/analytics';
import {
  GRID_COLS, GRID_ROW_HEIGHT, GRID_MARGIN, GRID_CONTAINER_PADDING, RIGHT_ANALYTICS_CREATE_QUERY, RIGHT_ANALYTICS_VIEW,
} from '../constants';
import MetricWidget from '../components/widgets/MetricWidget';
import ChartWidget from '../components/widgets/ChartWidget';
import TableWidget from '../components/widgets/TableWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    height: '100vh',
    overflow: 'auto',
  },
  header: {
    marginBottom: theme.spacing(3),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
  },
  dashboardSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(8),
    color: theme.palette.text.secondary,
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
  widgetContainer: {
    height: '100%',
  },
  error: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    color: theme.palette.error.main,
  },
}));

const AnalyticsDashboardPage = ({
  fetchDashboards,
  fetchDashboard,
  executeWidget,
  updateDashboardLayout,
  dashboards,
  currentDashboard,
  fetchingDashboards,
  fetchingDashboard,
  errorDashboards,
  errorDashboard,
  rights,
  history,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('analytics', modulesManager);
  const localise = (message) => localiseError(message, formatMessage, formatMessageWithValues);
  const allowed = hasRight(rights, RIGHT_ANALYTICS_VIEW);

  const [selectedDashboardId, setSelectedDashboardId] = useState(null);
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = useState(null);
  const [layout, setLayout] = useState([]);
  const [layoutError, setLayoutError] = useState(null);
  const [breakpoint, setBreakpoint] = useState('lg');
  const [widgetData, setWidgetData] = useState({});
  const [widgetErrors, setWidgetErrors] = useState({});
  const [loadingWidgets, setLoadingWidgets] = useState({});

  // Fetch available dashboards on mount
  useEffect(() => {
    if (!allowed) return;
    fetchDashboards(pageArgs({ rowsPerPage: 20 }));
  }, [fetchDashboards, allowed]);

  // Set default dashboard
  useEffect(() => {
    if (dashboards.length > 0 && !selectedDashboardId) {
      const defaultDashboard = dashboards.find(d => d.isDefault) || dashboards[0];
      setSelectedDashboardId(defaultDashboard.id);
    }
  }, [dashboards, selectedDashboardId]);

  // Fetch selected dashboard details
  useEffect(() => {
    if (selectedDashboardId) {
      fetchDashboard(selectedDashboardId);
    }
  }, [selectedDashboardId, fetchDashboard]);

  const widgets = currentDashboard?.widgets?.edges?.map(({ node }) => node) || [];
  const canEdit = Boolean(currentDashboard?.canEdit);

  // Stored widget positions (a JSON string from GraphQL) define the grid.
  useEffect(() => {
    setLayout(widgets.map(widgetLayout));
    setLayoutError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDashboard]);

  // Load every widget's data through its dashboard, which needs only the
  // dashboards right.
  useEffect(() => {
    widgets.forEach((widget) => {
      if (!widget.query) return;
      setLoadingWidgets((prev) => ({ ...prev, [widget.id]: true }));
      executeWidget(widget.id).then((action) => {
        const error = graphqlErrorMessage(action && action.payload)
          || (action && action.error ? requestErrorMessage(action.payload) || 'error' : null);
        const result = action && action.payload && action.payload.data
          ? action.payload.data.executeAnalyticsWidget
          : null;
        setWidgetData((prev) => ({ ...prev, [widget.id]: result }));
        setWidgetErrors((prev) => ({ ...prev, [widget.id]: error }));
        setLoadingWidgets((prev) => ({ ...prev, [widget.id]: false }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDashboard, executeWidget]);

  const handleDashboardChange = (dashboardId) => {
    setSelectedDashboardId(dashboardId);
    setDashboardMenuAnchor(null);
  };

  // Persist the arrangement once a drag or resize ends (owners with 200004 only).
  // Stored positions are in the 12-column `lg` grid, so only that grid is saved.
  const handleLayoutCommit = async (newLayout) => {
    if (breakpoint !== 'lg') return;
    setLayout(newLayout);
    if (!canEdit || !currentDashboard) return;
    const action = await updateDashboardLayout(currentDashboard.id, layoutPositions(newLayout));
    const error = graphqlErrorMessage(action && action.payload)
      || (action && action.error ? requestErrorMessage(action.payload) || 'error' : null);
    setLayoutError(error);
  };

  const renderWidget = (widget) => {
    // GraphQL returns `data` as a JSONString; parse it so recharts/table widgets can iterate.
    const rawData = widgetData[widget.id]?.data;
    let data = rawData;
    if (typeof rawData === 'string') {
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        data = [];
      }
    }
    if (!Array.isArray(data)) {
      data = [];
    }
    const loading = loadingWidgets[widget.id] || false;
    const rawError = widgetErrors[widget.id] || null;
    const error = rawError ? formatMessageWithValues('widget.error', { error: localise(rawError) }) : null;
    const config = parseJson(widget.config, {}) || {};

    // widget.widgetType comes back as an UPPERCASE Graphene enum ("BAR_CHART"); the
    // widget components switch on the underlying lowercase choice key ("bar_chart").
    const widgetTypeKey = (widget.widgetType || '').toLowerCase();
    switch (widgetTypeKey) {
      case 'metric':
        return (
          <MetricWidget
            title={widget.title}
            data={data}
            config={config}
            loading={loading}
            error={error}
          />
        );
      case 'bar_chart':
      case 'line_chart':
      case 'pie_chart':
        return (
          <ChartWidget
            title={widget.title}
            data={data}
            config={config}
            widgetType={widgetTypeKey}
            loading={loading}
            error={error}
          />
        );
      case 'table':
        return (
          <TableWidget
            title={widget.title}
            data={data}
            config={config}
            loading={loading}
            error={error}
          />
        );
      default:
        return (
          <Paper className={classes.widgetContainer}>
            <Box p={2}>
              <Typography>Unknown widget type: {widget.widgetType}</Typography>
            </Box>
          </Paper>
        );
    }
  };

  if (!allowed) {
    return (
      <div className={classes.root}>
        <Helmet title={formatMessage('dashboard.pageTitle')} />
        <Typography variant="body1" color="error" role="alert">
          {formatMessage('dashboard.noRight')}
        </Typography>
      </div>
    );
  }

  if (fetchingDashboards || (selectedDashboardId && fetchingDashboard)) {
    return (
      <div className={classes.root}>
        <Box className={classes.loading}>
          <CircularProgress />
        </Box>
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <Helmet title={formatMessage('dashboard.pageTitle')} />
      
      <Box className={classes.header}>
        <Box className={classes.dashboardSelector}>
          <DashboardIcon />
          <Typography variant="h5">
            {currentDashboard?.name || formatMessage('dashboard.title')}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => setDashboardMenuAnchor(e.currentTarget)}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        <Menu
          anchorEl={dashboardMenuAnchor}
          open={Boolean(dashboardMenuAnchor)}
          onClose={() => setDashboardMenuAnchor(null)}
        >
          {dashboards.map((dashboard) => (
            <MenuItem
              key={dashboard.id}
              onClick={() => handleDashboardChange(dashboard.id)}
              selected={dashboard.id === selectedDashboardId}
            >
              {dashboard.name}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {(errorDashboards || errorDashboard || layoutError) && (
        <Paper className={classes.error} role="alert">
          <Typography variant="body2">
            {localise(errorDashboards || errorDashboard)
              || formatMessageWithValues('dashboard.layoutError', { error: localise(layoutError) })}
          </Typography>
        </Paper>
      )}

      {widgets.length > 0 ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: GRID_COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={GRID_ROW_HEIGHT}
          margin={GRID_MARGIN}
          containerPadding={GRID_CONTAINER_PADDING}
          onBreakpointChange={setBreakpoint}
          onDragStop={handleLayoutCommit}
          onResizeStop={handleLayoutCommit}
          isDraggable={canEdit && breakpoint === 'lg'}
          isResizable={canEdit && breakpoint === 'lg'}
        >
          {widgets.map((widget) => (
            <div key={widget.id} className={classes.widgetContainer}>
              {renderWidget(widget)}
            </div>
          ))}
        </ResponsiveGridLayout>
      ) : (
        <Box className={classes.emptyState}>
          <Typography variant="h6" gutterBottom>
            {formatMessage('dashboard.noWidgets')}
          </Typography>
          <Typography variant="body2">
            {formatMessage('dashboard.addWidgetsHint')}
          </Typography>
        </Box>
      )}

      {hasRight(rights, RIGHT_ANALYTICS_CREATE_QUERY) && (
        <Fab
          className={classes.fab}
          color="primary"
          onClick={() => history.push('/analytics/query-builder')}
        >
          <AddIcon />
        </Fab>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  dashboards: state.analytics.dashboards,
  currentDashboard: state.analytics.currentDashboard,
  fetchingDashboards: state.analytics.fetchingDashboards,
  fetchingDashboard: state.analytics.fetchingDashboard,
  errorDashboards: state.analytics.errorDashboards,
  errorDashboard: state.analytics.errorDashboard,
  rights: state.core?.user?.i_user?.rights || [],
});

const mapDispatchToProps = {
  fetchDashboards,
  fetchDashboard,
  executeWidget,
  updateDashboardLayout,
};

export default connect(mapStateToProps, mapDispatchToProps)(AnalyticsDashboardPage);