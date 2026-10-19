export type Team = {
	name: string
	abbreviation: string
	conference: 'Eastern' | 'Western'
	href: string
}

export const teams: Team[] = [
	{ name: 'Atlanta Hawks', abbreviation: 'ATL', conference: 'Eastern', href: '#team-atl' },
	{ name: 'Boston Celtics', abbreviation: 'BOS', conference: 'Eastern', href: '#team-bos' },
	{ name: 'Brooklyn Nets', abbreviation: 'BKN', conference: 'Eastern', href: '#team-bkn' },
	{ name: 'Charlotte Hornets', abbreviation: 'CHA', conference: 'Eastern', href: '#team-cha' },
	{ name: 'Chicago Bulls', abbreviation: 'CHI', conference: 'Eastern', href: '#team-chi' },
	{ name: 'Cleveland Cavaliers', abbreviation: 'CLE', conference: 'Eastern', href: '#team-cle' },
	{ name: 'Detroit Pistons', abbreviation: 'DET', conference: 'Eastern', href: '#team-det' },
	{ name: 'Indiana Pacers', abbreviation: 'IND', conference: 'Eastern', href: '#team-ind' },
	{ name: 'Miami Heat', abbreviation: 'MIA', conference: 'Eastern', href: '#team-mia' },
	{ name: 'Milwaukee Bucks', abbreviation: 'MIL', conference: 'Eastern', href: '#team-mil' },
	{ name: 'New York Knicks', abbreviation: 'NYK', conference: 'Eastern', href: '#team-nyk' },
	{ name: 'Orlando Magic', abbreviation: 'ORL', conference: 'Eastern', href: '#team-orl' },
	{ name: 'Philadelphia 76ers', abbreviation: 'PHI', conference: 'Eastern', href: '#team-phi' },
	{ name: 'Toronto Raptors', abbreviation: 'TOR', conference: 'Eastern', href: '#team-tor' },
	{ name: 'Washington Wizards', abbreviation: 'WAS', conference: 'Eastern', href: '#team-was' },
	{ name: 'Dallas Mavericks', abbreviation: 'DAL', conference: 'Western', href: '#team-dal' },
	{ name: 'Denver Nuggets', abbreviation: 'DEN', conference: 'Western', href: '#team-den' },
	{ name: 'Golden State Warriors', abbreviation: 'GSW', conference: 'Western', href: '#team-gsw' },
	{ name: 'Houston Rockets', abbreviation: 'HOU', conference: 'Western', href: '#team-hou' },
	{ name: 'Los Angeles Clippers', abbreviation: 'LAC', conference: 'Western', href: '#team-lac' },
	{ name: 'Los Angeles Lakers', abbreviation: 'LAL', conference: 'Western', href: '#team-lal' },
	{ name: 'Memphis Grizzlies', abbreviation: 'MEM', conference: 'Western', href: '#team-mem' },
	{ name: 'Minnesota Timberwolves', abbreviation: 'MIN', conference: 'Western', href: '#team-min' },
	{ name: 'New Orleans Pelicans', abbreviation: 'NOP', conference: 'Western', href: '#team-nop' },
	{ name: 'Oklahoma City Thunder', abbreviation: 'OKC', conference: 'Western', href: '#team-okc' },
	{ name: 'Phoenix Suns', abbreviation: 'PHX', conference: 'Western', href: '#team-phx' },
	{ name: 'Portland Trail Blazers', abbreviation: 'POR', conference: 'Western', href: '#team-por' },
	{ name: 'Sacramento Kings', abbreviation: 'SAC', conference: 'Western', href: '#team-sac' },
	{ name: 'San Antonio Spurs', abbreviation: 'SAS', conference: 'Western', href: '#team-sas' },
	{ name: 'Utah Jazz', abbreviation: 'UTA', conference: 'Western', href: '#team-uta' },
]