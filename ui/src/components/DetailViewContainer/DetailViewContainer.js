import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { useHistory, useParams } from 'react-router-dom';
import useAuth from 'services/useAuth';
import WrappedLoader from 'components/WrappedLoader';
import { GET_RESP_FULFILLS, CACHE_QUERY } from 'services/queries';
import DetailView from './components/DetailView';

const createDetailViewQuery = (nodeType) => {
  const isResp = nodeType === 'responsibility';
  return gql`
  query DetailViewContainer_${nodeType}($nodeId: ID!) {
    ${nodeType}(nodeId: $nodeId) {
      nodeId
      title
      description
      guide {
        nodeId
        email
        name
      }
      ${isResp ? `realizer {
          nodeId
          email
          name
        }
        deliberations {
          nodeId
          title
          url
        }
        dependsOnResponsibilities {
          nodeId
          title
          fulfills {
            nodeId
          }
        }
        responsibilitiesThatDependOnThis {
          nodeId
          title
          fulfills {
            nodeId
          }
        }
      ` : ''}
      ${isResp ? 'fulfills' : 'fulfilledBy'} {
        nodeId
        title
      }
    }
    showDetailedEditView @client
  }
`;
};

const GET_NEED = createDetailViewQuery('need');
const GET_RESPONSIBILITY = createDetailViewQuery('responsibility');

const DetailViewContainer = ({ fullscreen, viewResp }) => {
  const auth = useAuth();
  const history = useHistory();
  const params = useParams();

  const { responsibilityId } = params;
  const skip = !responsibilityId;

  const {
    loading: loadingFulfills,
    error: errorFulfills,
    data: dataFulfills,
  } = useQuery(GET_RESP_FULFILLS, {
    variables: { responsibilityId },
    skip: skip || viewResp,
  });

  const needId = (responsibilityId && !loadingFulfills && dataFulfills)
    ? dataFulfills.responsibility.fulfills.nodeId : '';

  const queryProps = viewResp ? {
    query: GET_RESPONSIBILITY,
    variables: {
      nodeId: params.responsibilityId,
    },
    skip,
  } : {
    query: GET_NEED,
    variables: {
      nodeId: needId,
    },
    skip: skip && needId,
  };
  const {
    loading,
    error,
    data = {},
    client,
  } = useQuery(queryProps.query, queryProps);

  if (skip) return null;
  if (loadingFulfills || loading) return <WrappedLoader />;
  if (error) return `Error! ${error.message}`;
  if (errorFulfills) return `Error! ${errorFulfills.message}`;

  const fullscreenToggleUrl = fullscreen
    ? `/${params.orgSlug}/${params.responsibilityId || ''}`
    : `/${params.orgSlug}/reality/${params.responsibilityId || ''}`;
  const onClickFullscreen = () => history.push(fullscreenToggleUrl);

  const node = viewResp ? data.responsibility : data.need;
  if (!node) return null;
  return (
    <DetailView
      node={node}
      fullscreen={fullscreen}
      showEdit={data.showDetailedEditView}
      isLoggedIn={auth.isLoggedIn}
      onClickEdit={() => client.writeQuery({
        query: CACHE_QUERY,
        data: {
          showDetailedEditView: true,
        },
      })}
      onClickCancel={() => client.writeQuery({
        query: CACHE_QUERY,
        data: {
          showDetailedEditView: false,
        },
      })}
      onClickFullscreen={onClickFullscreen}
    />
  );
};

DetailViewContainer.propTypes = {
  fullscreen: PropTypes.bool,
  viewResp: PropTypes.bool.isRequired,
};

DetailViewContainer.defaultProps = {
  fullscreen: false,
};

export default DetailViewContainer;
