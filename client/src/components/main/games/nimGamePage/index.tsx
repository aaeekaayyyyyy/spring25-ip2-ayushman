import React from 'react';
import './index.css';
import { GameInstance } from '../../../../types';
import useNimGamePage from '../../../../hooks/useNimGamePage';

/**
 * Component to display the "Nim" game page, including the rules, game details, and functionality to make a move.
 * @param gameState The current state of the Nim game, including player details, game status, and remaining objects.
 * @returns A React component that shows:
 * - The rules of the Nim game.
 * - The current game details, such as players, current turn, remaining objects, and winner (if the game is over).
 * - An input field for making a move (if the game is in progress) and a submit button to finalize the move.
 */
const NimGamePage = ({ gameState }: { gameState: GameInstance }) => {
  const { user, move, handleMakeMove, handleInputChange } = useNimGamePage(gameState);

  // Extract players (assuming players is an array of usernames)
  const isPlayer1 = gameState.players[0] === user?._id;
  const isPlayer2 = gameState.players[1] === user?._id;

  // const player1 = gameState.players[0] ?? 'Waiting...';
  // const player2 = gameState.players[1] ?? 'Waiting...';

  // Current player to move (assumed stored in gameState.state.currentPlayer)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPlayerId = (gameState.state as any).currentPlayer ?? 'Unknown';

  // Remaining objects (assumed stored in gameState.state.remainingObjects)
  const remainingObjects = gameState.state.remainingObjects ?? 0;

  // Winner (assumed stored in gameState.state.winners as string[] or undefined)
  const winner =
    gameState.state.winners && gameState.state.winners.length > 0
      ? gameState.state.winners.join(', ')
      : null;

  // Check if game is in progress (assuming status 'IN_PROGRESS' means ongoing)
  const isInProgress = gameState.state.status === 'IN_PROGRESS';

  // Check if it is current user's turn
  const isUsersTurn = user?._id === currentPlayerId;
  console.log('gammeeeee stateeeeee', isUsersTurn, move);

  return (
    <>
      <div className='nim-rules'>
        <h2>Rules of Nim</h2>
        <p>The game of Nim is played as follows:</p>
        <ol>
          <li>The game starts with a pile of objects.</li>
          <li>Players take turns removing objects from the pile.</li>
          <li>On their turn, a player must remove 1, 2, or 3 objects from the pile.</li>
          <li>The player who removes the last object loses the game.</li>
        </ol>
        <p>Think strategically and try to force your opponent into a losing position!</p>
      </div>
      <div className='nim-game-details'>
        <h2>Current Game</h2>
        {/* TODO: Task 2 - Display the following game details using <p> elements:
          - Player 1: The username of player 1, or "Waiting..." if no player has joined yet.
          - Player 2: The username of player 2, or "Waiting..." if no player has joined yet.
          - Current Player to Move: The username of the player who should make the next move.
          - Remaining Objects: The number of objects remaining in the pile.
          - Winner: The winner of the game, or "No winner" if the winner is not defined. (Conditionally rendered)
        */}
        <p>
          <strong>Player 1:</strong> {isPlayer1 ? user?.username : 'Waiting...'}
        </p>
        <p>
          <strong>Player 2:</strong> {isPlayer2 ? user?.username : 'Waiting...'}
        </p>
        <p>
          <strong>Current Player to Move:</strong> {isUsersTurn ? user?.username : currentPlayerId}
        </p>
        <p>
          <strong>Remaining Objects:</strong> {remainingObjects}
        </p>
        {winner && (
          <p>
            <strong>Winner:</strong> {winner}
          </p>
        )}
        {/* TODO: Task 2 - Conditionally render game move input for an in progress game */}
        {isInProgress && (
          <div className='nim-game-move'>
            <h3>Make Your Move</h3>
            {/* TODO: Task 2 - Implement the input field which takes a number input.
            Use the class name 'input-move' for styling. */}
            {/* TODO: Task 2 - Implement the submit button which submits the entered move.
            The button should be disabled if it is not the user's turn.
            Use the class name 'btn-submit' for styling. */}
            <input
              type='number'
              min={1}
              max={3}
              value={move}
              onChange={handleInputChange}
              className='input-move'
              disabled={!isUsersTurn}
            />
            <button
              onClick={handleMakeMove}
              disabled={!isUsersTurn || !move || Number(move) < 1 || Number(move) > 3}
              className='btn-submit'>
              Submit Move
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NimGamePage;
