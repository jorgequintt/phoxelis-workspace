import './style.css';
import { createElement } from 'react';
import { notifications } from '@mantine/notifications';
import { registerSW } from 'virtual:pwa-register';
import { ReactEditor } from './editor/react/ReactEditor';
import { PwaUpdateMessage } from './editor/react/atoms/PwaUpdateMessage';

// PWA service worker registration with prompt-to-update. See docs/PWA.md.
const updateSW = registerSW({
  onNeedRefresh() {
    notifications.show({
      id: 'pwa-update',
      title: 'New version available',
      message: createElement(PwaUpdateMessage, {
        onReload: () => updateSW(true),
      }),
      color: 'teal',
      autoClose: false,
      withCloseButton: true,
    });
  },
  onOfflineReady() {
    notifications.show({
      id: 'pwa-offline',
      title: 'Ready to work offline',
      message: 'Phoebis can now be used without an internet connection.',
      color: 'teal',
      autoClose: 6000,
    });
  },
});

const editor = new ReactEditor();
const lastDocId = localStorage.getItem('last_doc');
if (lastDocId) {
  editor.loadDocument(lastDocId);
} else {
  editor.startSession();
}
