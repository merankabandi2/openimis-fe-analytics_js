import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslations, useModulesManager, withTooltip, Helmet } from '@openimis/fe-core';
import QueryBuilder from '../components/QueryBuilder';
import { createQuery, updateQuery } from '../actions';
import {
  RIGHT_ANALYTICS_CREATE_QUERY,
  RIGHT_ANALYTICS_SAVE_QUERY,
  RIGHT_ANALYTICS_SHARE,
  RIGHT_ANALYTICS_UPDATE_QUERY,
} from '../constants';
import {
  graphqlErrorMessage, hasRight, localiseError, requestErrorMessage,
} from '../utils/analytics';

const useStyles = makeStyles((theme) => ({
  page: {
    margin: theme.spacing(3),
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const QueryBuilderPage = ({ createQuery, updateQuery, rights, history, location }) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('analytics', modulesManager);

  // Incoming state from SavedQueriesPage (Run/Edit/Copy navigation).
  const incoming = (location && location.state) || {};
  const editingQueryId = incoming.queryId || null;
  const canSave = hasRight(rights, editingQueryId ? RIGHT_ANALYTICS_UPDATE_QUERY : RIGHT_ANALYTICS_SAVE_QUERY);
  const canShare = hasRight(rights, RIGHT_ANALYTICS_SHARE);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState(incoming.queryName || '');
  const [queryDescription, setQueryDescription] = useState(incoming.queryDescription || '');
  const [isPublic, setIsPublic] = useState(incoming.isPublic || false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [currentEntityType, setCurrentEntityType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const handleSaveQuery = (entityType, queryConfig) => {
    setCurrentEntityType(entityType);
    setCurrentConfig(queryConfig);
    setSaveError(null);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (queryName && currentEntityType && currentConfig) {
      const input = {
        name: queryName,
        description: queryDescription,
        entityType: currentEntityType,
        queryConfig: JSON.stringify(currentConfig),
        // Without the share right the public flag keeps its saved value.
        isPublic: canShare ? isPublic : Boolean(editingQueryId && incoming.isPublic),
      };

      setSaving(true);
      const action = editingQueryId ? await updateQuery(editingQueryId, input) : await createQuery(input);
      setSaving(false);
      // fe-core resolves failed requests too: a GraphQL refusal comes back with
      // `errors`, a network/HTTP failure as an error action.
      const error = graphqlErrorMessage(action && action.payload)
        || (action && action.error ? requestErrorMessage(action.payload) || 'error' : null);
      if (error) {
        setSaveError(error);
        return;
      }
      setSaveDialogOpen(false);
      history.push('/analytics/saved-queries');
    }
  };

  const handleExecuteQuery = (entityType, queryConfig) => {
    // Query execution is handled by the QueryBuilder component
    console.log('Query executed:', entityType, queryConfig);
  };

  if (!hasRight(rights, RIGHT_ANALYTICS_CREATE_QUERY)) {
    return (
      <div className={classes.page}>
        <Helmet title={formatMessage('queryBuilder.pageTitle')} />
        <Typography variant="body1" color="error" role="alert">
          {formatMessage('queryBuilder.noRight')}
        </Typography>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('queryBuilder.pageTitle')} />
      
      <QueryBuilder
        entityType={incoming.entityType}
        queryConfig={incoming.queryConfig}
        autoRun={Boolean(incoming.autoRun)}
        onSave={canSave ? handleSaveQuery : null}
        onExecute={handleExecuteQuery}
      />

      {/* Save Query Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{formatMessage('queryBuilder.saveQueryTitle')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={formatMessage('queryBuilder.queryName')}
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label={formatMessage('queryBuilder.queryDescription')}
              value={queryDescription}
              onChange={(e) => setQueryDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            {canShare && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                }
                label={formatMessage('queryBuilder.makePublic')}
              />
            )}
            {saveError && (
              <Typography variant="body2" color="error" role="alert">
                {formatMessageWithValues('queryBuilder.saveError', { error: localiseError(saveError, formatMessage, formatMessageWithValues) })}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>
            {formatMessage('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmSave}
            color="primary"
            variant="contained"
            disabled={!queryName || saving}
          >
            {formatMessage('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights || [],
});

const mapDispatchToProps = {
  createQuery,
  updateQuery,
};

export default withTooltip(
  connect(mapStateToProps, mapDispatchToProps)(QueryBuilderPage)
);