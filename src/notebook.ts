import { PageConfig } from '@jupyterlab/coreutils';
import { CommandRegistry } from '@lumino/commands';
import { CommandPalette, Widget } from '@lumino/widgets';
import { ServiceManager } from '@jupyterlab/services';
import { MathJaxTypesetter } from '@jupyterlab/mathjax2';
import {
  NotebookPanel,
  NotebookWidgetFactory,
  NotebookModelFactory,
} from '@jupyterlab/notebook';
import {
  CompleterModel,
  Completer,
  CompletionHandler,
  KernelConnector,
} from '@jupyterlab/completer';
import { editorServices } from '@jupyterlab/codemirror';
import { DocumentManager } from '@jupyterlab/docmanager';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  RenderMimeRegistry,
  standardRendererFactories as initialFactories,
} from '@jupyterlab/rendermime';
import { SetupCommands } from './commands';

import styles from './notebook.css';

function createApp(root: HTMLElement, manager: ServiceManager.IManager): void {
  // Initialize the command registry with the bindings.
  let commands = new CommandRegistry();

  // Setup the keydown listener for the document.
  document.addEventListener(
    'keydown',
    commands.processKeydownEvent.bind(commands),
    true
  );

  let rendermime = new RenderMimeRegistry({
    initialFactories: initialFactories,
    latexTypesetter: new MathJaxTypesetter({
      url: PageConfig.getOption('mathjaxUrl'),
      config: PageConfig.getOption('mathjaxConfig'),
    }),
  });

  let opener = { open: (widget: Widget) => {} };
  let docRegistry = new DocumentRegistry();
  let docManager = new DocumentManager({
    registry: docRegistry,
    manager,
    opener,
  });

  let mFactory = new NotebookModelFactory({});
  let editorFactory = editorServices.factoryService.newInlineEditor;
  let contentFactory = new NotebookPanel.ContentFactory({ editorFactory });

  let wFactory = new NotebookWidgetFactory({
    name: 'Notebook',
    modelName: 'notebook',
    fileTypes: ['notebook'],
    defaultFor: ['notebook'],
    preferKernel: true,
    canStartKernel: true,
    rendermime,
    contentFactory,
    mimeTypeService: editorServices.mimeTypeService,
  });

  docRegistry.addModelFactory(mFactory);
  docRegistry.addWidgetFactory(wFactory);

  let notebookPath = PageConfig.getOption('notebookPath');
  let nbWidget = docManager.open(notebookPath) as NotebookPanel;
  let palette = new CommandPalette({ commands });
  palette.addClass('notebookCommandPalette');

  const editor =
    nbWidget.content.activeCell && nbWidget.content.activeCell.editor;
  const model = new CompleterModel();
  const completer = new Completer({ editor, model });
  const connector = new KernelConnector({
    session: nbWidget.context.sessionContext.session,
  });
  const handler = new CompletionHandler({ completer, connector });

  // Set the handler's editor.
  handler.editor = editor;

  // Listen for active cell changes.
  nbWidget.content.activeCellChanged.connect((sender, cell) => {
    handler.editor = cell && cell.editor;
  });

  // Hide the widget when it first loads.
  completer.hide();

  // Attach the widgets to the root DOM element.
  Widget.attach(nbWidget, root);
  Widget.attach(completer, root);

  SetupCommands(commands, palette, nbWidget, handler);
}

class ESRFNotebook extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'closed' });

    // Put all styles inside web component and make sure custom variables still work
    const styleElem = document.createElement('style');
    styleElem.innerHTML = styles.toString().replace(/:root/g, ':host');
    shadowRoot.appendChild(styleElem);

    // Create wrapper for notebook and append to body first, so `Widget.attach` doesn't complain
    const rootElem = document.createElement('div');
    rootElem.id = 'notebook';
    document.body.appendChild(rootElem);

    // Initialise notebook
    const manager = new ServiceManager();
    manager.ready.then(() => {
      createApp(rootElem, manager);

      // Move wrapper element inside web component
      shadowRoot.appendChild(rootElem);
    });
  }
}

window.customElements.define('esrf-notebook', ESRFNotebook);
