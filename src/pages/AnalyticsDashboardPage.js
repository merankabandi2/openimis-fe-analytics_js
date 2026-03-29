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
import { fetchDashboards, fetchDashboard, executeQuery } from '../actions';
import { GRID_COLS, GRID_ROW_HEIGHT, GRID_MARGIN, GRID_CONTAINER_PADDING } from '../constants';
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
}));

const AnalyticsDashboardPage = ({
  fetchDashboards,
  fetchDashboard,
  executeQuery,
  dashboards,
  currentDashboard,
  fetchingDashboards,
  fetchingDashboard,
  queryResults,
  history,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);

  const [selectedDashboardId, setSelectedDashboardId] = useState(null);
  const [dashboardMenuAnchor, setDashboardMenuAnchor] = useState(null);
  const [layouts, setLayouts] = useState({});
  const [widgetData, setWidgetData] = useState({});
  const [loadingWidgets, setLoadingWidgets] = useState({});

  // Fetch available dashboards on mount
  useEffect(() => {
    fetchDashboards({ first: 20 });
  }, [fetchDashboards]);

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

  // Execute queries for all widgets
  useEffect(() => {
    if (currentDashboard?.widgets?.edges) {
      currentDashboard.widgets.edges.forEach(({ node: widget }) => {
        if (widget.query) {
          setLoadingWidgets(prev => ({ ...prev, [widget.id]: true }));
          executeQuery(widget.query.entityType, JSON.parse(widget.query.queryConfig))
            .then((result) => {
              setWidgetData(prev => ({ ...prev, [widget.id]: result.payload.data.executeAnalyticsQuery }));
              setLoadingWidgets(prev => ({ ...prev, [widget.id]: false }));
            });
        }
      });
    }
  }, [currentDashboard, executeQuery]);

  const handleDashboardChange = (dashboardId) => {
    setSelectedDashboardId(dashboardId);
    setDashboardMenuAnchor(null);
  };

  const handleLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
    // TODO: Save layout to backend
  };

  const renderWidget = (widget) => {
    const data = widgetData[widget.id]?.data || [];
    const loading = loadingWidgets[widget.id] || false;

    switch (widget.widgetType) {
      case 'metric':
        return (
          <MetricWidget
            title={widget.title}
            data={data}
            config={widget.config}
            loading={loading}
          />
        );
      case 'bar_chart':
      case 'line_chart':
      case 'pie_chart':
        return (
          <ChartWidget
            title={widget.title}
            data={data}
            config={widget.config}
            widgetType={widget.widgetType}
            loading={loading}
          />
        );
      case 'table':
        return (
          <TableWidget
            title={widget.title}
            data={data}
            config={widget.config}
            loading={loading}
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

  const generateLayout = () => {
    if (!currentDashboard?.widgets?.edges) return [];
    
    return currentDashboard.widgets.edges.map(({ node: widget }) => ({
      i: widget.id,
      x: widget.position.x || 0,
      y: widget.position.y || 0,
      w: widget.position.w || 4,
      h: widget.position.h || 4,
      minW: 2,
      minH: 2,
    }));
  };

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

      {currentDashboard?.widgets?.edges?.length > 0 ? (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: generateLayout() }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: GRID_COLS, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={GRID_ROW_HEIGHT}
          margin={GRID_MARGIN}
          containerPadding={GRID_CONTAINER_PADDING}
          onLayoutChange={handleLayoutChange}
          isDraggable={true}
          isResizable={true}
        >
          {currentDashboard.widgets.edges.map(({ node: widget }) => (
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

      <Fab
        className={classes.fab}
        color="primary"
        onClick={() => history.push('/analytics/query-builder')}
      >
        <AddIcon />
      </Fab>
    </div>
  );
};

const mapStateToProps = (state) => ({
  dashboards: state.analytics.dashboards,
  currentDashboard: state.analytics.currentDashboard,
  fetchingDashboards: state.analytics.fetchingDashboards,
  fetchingDashboard: state.analytics.fetchingDashboard,
  queryResults: state.analytics.queryResults,
});

const mapDispatchToProps = {
  fetchDashboards,
  fetchDashboard,
  executeQuery,
};

export default connect(mapStateToProps, mapDispatchToProps)(AnalyticsDashboardPage);