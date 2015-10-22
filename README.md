# sanstmuxinator

Run tmuxinator configs without tmuxinator or tmux.

Simply spawns each process in bash and writes their output to logfiles (in /tmp/sanstmuxinator/TIMESTAMP/ by default).

**Installation:** `npm install -g sanstmuxinator`

**Usage:** `sanstmuxinator --config PATH_TO_TMUXINATOR_CONFIG [--logDir PATH_TO_BASE_DIRECTORY] [--cwd CWD_FOR_SPAWNED_PROCESSES]`
