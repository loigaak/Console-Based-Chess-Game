#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

const GAME_STATE_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.chess_game.json');

// Initial chessboard setup (8x8, using FEN-like representation)
let board = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.'],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];
let currentPlayer = 'white';

async function saveGame() {
  const state = { board, currentPlayer };
  await fs.writeFile(GAME_STATE_FILE, JSON.stringify(state, null, 2));
  console.log(chalk.green('Game saved successfully!'));
}

async function loadGame() {
  try {
    const data = await fs.readFile(GAME_STATE_FILE, 'utf8');
    const state = JSON.parse(data);
    board = state.board;
    currentPlayer = state.currentPlayer;
    console.log(chalk.green('Game loaded successfully!'));
  } catch {
    console.log(chalk.yellow('No saved game found. Starting new game.'));
  }
}

function displayBoard() {
  console.log(chalk.blue('  a b c d e f g h'));
  for (let i = 0; i < 8; i++) {
    let row = `${8 - i} `;
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      const color = piece === '.' ? chalk.gray : piece.toUpperCase() === piece ? chalk.white : chalk.black;
      row += color(piece === '.' ? '.' : piece) + ' ';
    }
    console.log(row + `${8 - i}`);
  }
  console.log(chalk.blue('  a b c d e f g h'));
  console.log(chalk.cyan(`Current player: ${currentPlayer}`));
}

// Convert algebraic notation (e.g., "e2e4") to board coordinates
function parseMove(move) {
  if (!/^[a-h][1-8][a-h][1-8]$/.test(move)) {
    throw new Error('Invalid move format. Use algebraic notation (e.g., e2e4).');
  }
  const fromCol = move.charCodeAt(0) - 'a'.charCodeAt(0);
  const fromRow = 8 - parseInt(move[1]);
  const toCol = move.charCodeAt(2) - 'a'.charCodeAt(0);
  const toRow = 8 - parseInt(move[3]);
  return { from: [fromRow, fromCol], to: [toRow, toCol] };
}

// Basic move validation (simplified, only checks piece ownership and empty destination)
function isValidMove(from, to) {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const piece = board[fromRow][fromCol];
  if (piece === '.') {
    return false;
  }
  const isWhitePiece = piece.toUpperCase() === piece;
  if ((currentPlayer === 'white' && !isWhitePiece) || (currentPlayer === 'black' && isWhitePiece)) {
    return false;
  }
  // Simplified: Allow move if destination is empty or has opponent's piece
  const destPiece = board[toRow][toCol];
  if (destPiece === '.') {
    return true;
  }
  const isDestWhite = destPiece.toUpperCase() === destPiece;
  return isWhitePiece !== isDestWhite;
}

async function makeMove(move) {
  try {
    const { from, to } = parseMove(move);
    if (!isValidMove(from, to)) {
      console.log(chalk.red('Invalid move!'));
      return;
    }
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = '.';
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    console.log(chalk.green('Move successful!'));
    displayBoard();
  } catch (error) {
    console.log(chalk.red(error.message));
  }
}

program
  .command('move <notation>')
  .description('Make a move using algebraic notation (e.g., e2e4)')
  .action((notation) => makeMove(notation));

program
  .command('board')
  .description('Display the current chessboard')
  .action(() => displayBoard());

program
  .command('save')
  .description('Save the current game state')
  .action(() => saveGame());

program
  .command('load')
  .description('Load a saved game')
  .action(async () => {
    await loadGame();
    displayBoard();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  displayBoard();
}
