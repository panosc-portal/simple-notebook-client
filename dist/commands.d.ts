/**
 * Set up keyboard shortcuts & commands for notebook
 */
import { CommandRegistry } from '@lumino/commands';
import { CompletionHandler } from '@jupyterlab/completer';
import { NotebookPanel } from '@jupyterlab/notebook';
import { CommandPalette } from '@lumino/widgets';
export declare const SetupCommands: (commands: CommandRegistry, palette: CommandPalette, nbWidget: NotebookPanel, handler: CompletionHandler) => void;
