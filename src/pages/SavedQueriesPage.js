import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Box,
  Typography,
  Tooltip,
  Fab,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  PlayArrow as RunIcon,
  Edit as EditIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@material-ui/icons';
import { useTranslations, useModulesManager, Helmet, formatDateFromISO } from '@openimis/fe-core';
import { fetchQueries } from '../actions';
import { ENTITY_TYPES, DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS } from '../constants';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(3),
  },
  header: {
    marginBottom: theme.spacing(3),
  },
  tableContainer: {
    maxHeight: 'calc(100vh - 300px)',
  },
  headerCell: {
    fontWeight: 600,
    backgroundColor: theme.palette.grey[100],
  },
  actions: {
    display: 'flex',
    gap: theme.spacing(0.5),
  },
  publicChip: {
    marginLeft: theme.spacing(1),
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const SavedQueriesPage = ({
  fetchQueries,
  queries,
  queriesPageInfo,
  fetchingQueries,
  history,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    fetchQueries({
      first: rowsPerPage,
      after: page * rowsPerPage,
      orderBy: ['-validityFrom'],
    });
  }, [fetchQueries, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRunQuery = (query) => {
    history.push({
      pathname: '/analytics/query-builder',
      state: {
        entityType: query.entityType,
        queryConfig: JSON.parse(query.queryConfig),
      },
    });
  };

  const handleEditQuery = (query) => {
    history.push({
      pathname: '/analytics/query-builder',
      state: {
        queryId: query.id,
        entityType: query.entityType,
        queryConfig: JSON.parse(query.queryConfig),
        queryName: query.name,
        queryDescription: query.description,
      },
    });
  };

  const handleCopyQuery = (query) => {
    history.push({
      pathname: '/analytics/query-builder',
      state: {
        entityType: query.entityType,
        queryConfig: JSON.parse(query.queryConfig),
        queryName: `${query.name} (Copy)`,
        queryDescription: query.description,
      },
    });
  };

  const handleDeleteQuery = (query) => {
    // TODO: Implement delete with confirmation dialog
    console.log('Delete query:', query);
  };

  const handleCreateNew = () => {
    history.push('/analytics/query-builder');
  };

  return (
    <div className={classes.root}>
      <Helmet title={formatMessage('savedQueries.pageTitle')} />
      
      <Box className={classes.header}>
        <Typography variant="h4">
          {formatMessage('savedQueries.title')}
        </Typography>
      </Box>

      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className={classes.headerCell}>
                {formatMessage('savedQueries.name')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('savedQueries.entityType')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('savedQueries.createdBy')}
              </TableCell>
              <TableCell className={classes.headerCell}>
                {formatMessage('savedQueries.dateCreated')}
              </TableCell>
              <TableCell className={classes.headerCell} align="center">
                {formatMessage('savedQueries.actions')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queries.map((query) => (
              <TableRow key={query.id} hover>
                <TableCell>
                  {query.name}
                  {query.isPublic && (
                    <Chip
                      label={formatMessage('savedQueries.public')}
                      size="small"
                      color="primary"
                      variant="outlined"
                      className={classes.publicChip}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {formatMessage(`entity.${query.entityType}`)}
                </TableCell>
                <TableCell>{query.createdBy?.username}</TableCell>
                <TableCell>{formatDateFromISO(query.validityFrom)}</TableCell>
                <TableCell>
                  <Box className={classes.actions}>
                    <Tooltip title={formatMessage('savedQueries.run')}>
                      <IconButton
                        size="small"
                        onClick={() => handleRunQuery(query)}
                      >
                        <RunIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={formatMessage('savedQueries.edit')}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditQuery(query)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={formatMessage('savedQueries.copy')}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyQuery(query)}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={formatMessage('savedQueries.delete')}>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteQuery(query)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        component="div"
        count={queriesPageInfo.totalCount || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Fab
        className={classes.fab}
        color="primary"
        onClick={handleCreateNew}
      >
        <AddIcon />
      </Fab>
    </div>
  );
};

const mapStateToProps = (state) => ({
  queries: state.analytics.queries,
  queriesPageInfo: state.analytics.queriesPageInfo,
  fetchingQueries: state.analytics.fetchingQueries,
});

const mapDispatchToProps = {
  fetchQueries,
};

export default connect(mapStateToProps, mapDispatchToProps)(SavedQueriesPage);