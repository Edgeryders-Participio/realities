import React from 'react';
import {
  Card, CardTitle, Button,
} from 'reactstrap';
import { FaPlus } from 'react-icons/fa';
import useAuth from 'services/useAuth';

const CreateOrgCard = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Card body>
      <CardTitle>
        { isLoggedIn
          ? 'Create a new organization'
          : 'You need to be logged in to create a new organization'}
      </CardTitle>
      {isLoggedIn && (
        <Button
          onClick={() => window.location.assign(
            `http${
              process.env.NODE_ENV === 'production' ? 's' : ''
            }://${
              process.env.REACT_APP_DREAMS_URL
            }/organizations/create?from=realities`,
          )}
          data-cy="create-org-plus-btn"
        >
          <FaPlus />
        </Button>
      )}
    </Card>
  );
};

export default CreateOrgCard;
