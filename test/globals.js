// test/globals.js
// Must be imported FIRST — sets up DOM globals before any Web Component is loaded.
import { Window } from 'happy-dom';
import { default as FakeIndexedDB } from 'fake-indexeddb';

const happyWindow = new Window({ url: 'http://localhost' });

global.window = happyWindow;
global.document = happyWindow.document;
global.HTMLElement = happyWindow.HTMLElement;
global.customElements = happyWindow.customElements;
global.CustomEvent = happyWindow.CustomEvent;
global.Event = happyWindow.Event;
global.Node = happyWindow.Node;
global.MutationObserver = happyWindow.MutationObserver;
global.indexedDB = FakeIndexedDB;
