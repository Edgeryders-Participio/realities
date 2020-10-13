import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import * as yup from 'yup';
import { withRouter } from 'react-router-dom';
import { Formik } from 'formik';
import { GET_RESPONSIBILITIES, SET_CACHE } from '@/services/queries';
import ListForm from '@/components/ListForm';

const CREATE_RESPONSIBILITY = gql`
  mutation CreateResponsibility_createResponsibilityMutation($title: String!, $needId: ID!) {
    createResponsibility(title: $title, needId: $needId) {
      nodeId
      title
      realizer {
        nodeId
        name
      }
    }
  }
`;

const CreateResponsibility = withRouter(({ match, history }) => {
  const [createResponsibility] = useMutation(CREATE_RESPONSIBILITY, {
    update: (cache, { data: { createResponsibility: createRespRes } }) => {
      cache.writeQuery({
        query: SET_CACHE,
        data: {
          showCreateResponsibility: false,
        },
      });
      const { responsibilities } = cache.readQuery({
        query: GET_RESPONSIBILITIES,
        variables: { needId: match.params.needId },
      });

      const alreadyExists =
        responsibilities.filter(resp => resp.nodeId === createRespRes.nodeId).length > 0;

      if (!alreadyExists) {
        cache.writeQuery({
          query: GET_RESPONSIBILITIES,
          variables: { needId: match.params.needId },
          data: {
            responsibilities: [createRespRes, ...responsibilities],
          },
        });
      }
    },
  });

  return (
    <Formik
      initialValues={{ title: '' }}
      validationSchema={yup.object().shape({
        title: yup.string().required('Title is required'),
      })}
      onSubmit={(values, { resetForm }) => {
        createResponsibility({
          variables: {
            title: values.title,
            needId: match.params.needId,
          },
        }).then(({ data }) => {
          resetForm();
          history.push(`/${match.params.needId}/${data.createResponsibility.nodeId}`);
        });
      }}
    >
      {({
        values,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
      }) => (
        <ListForm
          inputName="title"
          placeholder="Enter a title for the new responsibility..."
          value={values.title}
          handleChange={handleChange}
          handleBlur={handleBlur}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </Formik>
  );
});

CreateResponsibility.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      needId: PropTypes.string,
    }),
  }),
  history: PropTypes.shape({
    push: PropTypes.func,
  }),
};

CreateResponsibility.defaultProps = {
  match: {
    params: {
      needId: undefined,
    },
  },
  history: {
    push: () => null,
  },
};

export default CreateResponsibility;
