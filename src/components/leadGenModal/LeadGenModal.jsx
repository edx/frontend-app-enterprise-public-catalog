import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, ModalDialog } from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';

import {
  LEAD_GEN_DEFAULT_HEIGHT,
  LEAD_GEN_HEIGHT_MESSAGE_KEY,
  LEAD_GEN_SUBMIT_MESSAGE_KEY,
} from '../../constants';
import { buildLeadGenFormUrl, getLeadGenFormOrigin } from '../../utils/utmUtils';

/**
 * Marketing lead capture form, shown before the catalog download for visitors who
 * arrived from a campaign link (ENT-10928).
 *
 * The form is a cross-origin Pardot page, so its submit event is not observable from
 * here. It must tell us, by posting a message to the parent window:
 *
 *     parent.postMessage({ pardotFormSubmitted: true }, 'https://<catalog origin>');
 *
 * The form already posts `{ iframeHeight }` on load and on every field change, which we
 * use to size the dialog, but it does not post the submit message yet. Until the Pardot
 * page is updated, `onSubmitted` never fires -- see FEATURE_LEAD_GEN_SOFT_GATE in
 * DownloadCsvButton for the interim behaviour.
 *
 * Note that the redirect/`onLoad` approach does not work as a substitute: the form POSTs
 * to its own URL, so a failed validation fires an identical load event and would be
 * indistinguishable from a successful submit.
 */
const LeadGenModal = ({ isOpen, onClose, onSubmitted }) => {
  const intl = useIntl();
  const { LEAD_GEN_FORM_URL: formUrl } = getConfig();
  const [height, setHeight] = useState(LEAD_GEN_DEFAULT_HEIGHT);

  const formOrigin = getLeadGenFormOrigin(formUrl);
  const src = formOrigin ? buildLeadGenFormUrl(formUrl) : null;

  useEffect(() => {
    if (!isOpen || !formOrigin) {
      return undefined;
    }
    const handleMessage = (event) => {
      // Reject anything not from the form: the page posts with targetOrigin '*', so
      // any frame on the page could otherwise unlock the download.
      if (event.origin !== formOrigin) {
        return;
      }
      const data = event.data || {};
      const reportedHeight = Number(data[LEAD_GEN_HEIGHT_MESSAGE_KEY]);
      if (reportedHeight > 0) {
        setHeight(reportedHeight);
      }
      if (data[LEAD_GEN_SUBMIT_MESSAGE_KEY] === true) {
        onSubmitted();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, formOrigin, onSubmitted]);

  const title = intl.formatMessage({
    id: 'catalogs.leadGenModal.title',
    defaultMessage: 'Tell us about yourself',
    description: 'Title of the form shown before the catalog can be downloaded.',
  });

  return (
    <ModalDialog
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      hasCloseButton
      isFullscreenOnMobile
      className="lead-gen-modal"
    >
      <ModalDialog.Header>
        <ModalDialog.Title>{title}</ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body className="p-0">
        {src ? (
          <iframe
            title={intl.formatMessage({
              id: 'catalogs.leadGenModal.iframeTitle',
              defaultMessage: 'Catalog download request form',
              description: 'Accessible name for the embedded lead generation form.',
            })}
            src={src}
            width="100%"
            height={height}
            frameBorder="0"
            style={{ border: 0 }}
          />
        ) : (
          <Alert variant="warning" className="m-3">
            {intl.formatMessage({
              id: 'catalogs.leadGenModal.unavailable',
              defaultMessage: 'This form is currently unavailable. Please try again later.',
              description: 'Shown when the lead generation form URL is not configured.',
            })}
          </Alert>
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
