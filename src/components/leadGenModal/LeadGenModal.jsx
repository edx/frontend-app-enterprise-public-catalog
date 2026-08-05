import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ModalDialog, Spinner } from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';

import { LEAD_GEN_SUBMIT_MESSAGE_KEY } from '../../constants';
import { buildLeadGenFormUrl, getLeadGenFormOrigin } from '../../utils/utmUtils';

const LeadGenModal = ({ isOpen, onClose, onSubmitted }) => {
  const { LEAD_GEN_FORM_URL: formUrl } = getConfig();
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  const formOrigin = getLeadGenFormOrigin(formUrl);
  const src = formOrigin ? buildLeadGenFormUrl(formUrl) : null;

  useEffect(() => {
    if (!isOpen || !formOrigin) {
      return undefined;
    }
    const handleMessage = (event) => {
      if (event.origin !== formOrigin) {
        return;
      }
      const data = event.data || {};
      if (data[LEAD_GEN_SUBMIT_MESSAGE_KEY] === true) {
        onSubmitted();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, formOrigin, onSubmitted]);

  return (
    <ModalDialog
      title="Catalog download request form"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      hasCloseButton={false}
      isFullscreenOnMobile
      isOverflowVisible
      className="lead-gen-modal"
    >
      <ModalDialog.Body>
        {src && (
          <>
            {!isIframeLoaded && (
              <div className="d-flex justify-content-center align-items-center" style={{ height: 500 }}>
                <Spinner animation="border" screenReaderText="Loading form" />
              </div>
            )}
            <iframe
              title="Catalog download request form"
              src={src}
              width="100%"
              height="500"
              type="text/html"
              frameBorder="0"
              style={{ border: 0, display: isIframeLoaded ? 'block' : 'none' }}
              onLoad={() => setIsIframeLoaded(true)}
            />
          </>
        )}
      </ModalDialog.Body>
    </ModalDialog>
  );
};

LeadGenModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmitted: PropTypes.func.isRequired,
};

export default LeadGenModal;
