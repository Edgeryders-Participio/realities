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
    showDetailedEditNeedView @client
    showDetailedEditRespView @client
  }
`;
};

const GET_NEED = createDetailViewQuery('need');
const GET_RESPONSIBILITY = createDetailViewQuery('responsibility');

const DetailViewContainer = ({ fullscreen, viewResp }) => {
  const auth = useAuth();
  const history = useHistory();
  const params = useParams();

  // sorry for the confusing code, i blame not being able to use control flow
  // around hooks

  /* there are 5 cases to handle
    * we're on an /orgSlug/respId url. we want to render need and resp at
    the same time
      1. we're rendering a need. get the needId from checking the resp's
      fulfills field
      2. we're rendering a resp. get the respId from the url
    * we're on an /orgSlug/need/needId url. we just want to render the need
      3. we're rendering the need. get the needId from the url
      4. we're "rendering" a resp. return null
    * we're just on /orgslug
      5. don't render anything
  */

  const {
    loading: loadingFulfills,
    error: errorFulfills,
    data: dataFulfills,
  } = useQuery(GET_RESP_FULFILLS, {
    variables: { responsibilityId: params.responsibilityId },
    skip: !params.responsibilityId || viewResp,
  });

  let needId;
  if (params.responsibilityId) {
    needId = (!loadingFulfills && dataFulfills)
      ? dataFulfills.responsibility.fulfills.nodeId : '';
  } else if (params.needId) {
    needId = params.needId;
  }

  const queryProps = viewResp ? {
    query: GET_RESPONSIBILITY,
    variables: {
      nodeId: params.responsibilityId,
    },
    skip: !params.responsibilityId,
  } : {
    query: GET_NEED,
    variables: {
      nodeId: needId,
    },
    skip: !needId,
  };
  const {
    loading,
    error,
    data = {},
    client,
  } = useQuery(queryProps.query, queryProps);

  if (!params.responsibilityId && !needId) return null;
  if (loadingFulfills || loading) return <WrappedLoader />;
  if (error) return `Error! ${error.message}`;
  if (errorFulfills) return `Error! ${errorFulfills.message}`;

  const fullscreenToggleUrl = fullscreen
    ? `/${params.orgSlug}/${params.responsibilityId || `need/${needId}`}`
    : `/${params.orgSlug}/reality/${params.responsibilityId || `need/${needId}`}`;
  const onClickFullscreen = () => history.push(fullscreenToggleUrl);

  const showEdit = viewResp ? data.showDetailedEditRespView : data.showDetailedEditNeedView;

  const setEdit = (val) => client.writeQuery({
    query: CACHE_QUERY,
    data: {
      showDetailedEditNeedView: !viewResp ? val : undefined,
      showDetailedEditRespView: viewResp ? val : undefined,
    },
  });

  const node = viewResp ? data.responsibility : data.need;
  if (!node) return null;
  return (
    <DetailView
      node={node}
      fullscreen={fullscreen}
      showEdit={showEdit}
      isLoggedIn={auth.isLoggedIn}
      startEdit={() => setEdit(true)}
      stopEdit={() => setEdit(false)}
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
