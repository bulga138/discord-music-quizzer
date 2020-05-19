"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicQuiz = void 0;
const ytdl_core_discord_1 = __importDefault(require("ytdl-core-discord"));
const spotify_1 = __importDefault(require("./spotify"));
const simple_youtube_api_1 = __importDefault(require("simple-youtube-api"));
const config_json_1 = require("../config.json");
class MusicQuiz {
    constructor(message, args) {
        this.youtube = new simple_youtube_api_1.default(config_json_1.youtubeApiKey);
        this.currentSong = 0;
        this.message = message;
        this.arguments = args;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = this.message.member.voice.channel;
            this.songs = yield this.getSongs(this.arguments.playlist, parseInt(this.arguments.songs, 10));
            if (this.songs === null) {
                return;
            }
            this.connection = yield channel.join();
            this.currentSong = 0;
            this.scores = {};
            this.startPlaying();
            //TODO: make sure to kill this when quiz is over
            const collector = this.message.channel
                .createMessageCollector((message) => !message.author.bot)
                .on('collect', message => this.handleMessage(message));
        });
    }
    startPlaying() {
        return __awaiter(this, void 0, void 0, function* () {
            this.titleGuessed = false;
            this.artistGuessed = false;
            const song = this.songs[this.currentSong];
            const link = yield this.findSong(song);
            this.musicStream = yield ytdl_core_discord_1.default(link);
            //this.musicStream = request(song.previewUrl)
            //.pipe(fs.create('song1.mp3'))
            console.log(song);
            const dispatcher = this.connection
                .play(this.musicStream, { type: 'opus' })
                .on('start', () => {
                dispatcher.setVolume(.5);
            })
                .on('finish', (info) => console.log(info))
                .on('error', e => console.log(e, 'error'))
                .on('exit', () => {
                console.log('exit');
                if (this.musicStream)
                    this.musicStream.destroy();
            });
            console.log('wat');
        });
    }
    handleMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.content === "!skip") {
                return this.nextSong('Song skipped!');
            }
            const song = this.songs[this.currentSong];
            console.log(song);
            let score = this.scores[message.author.id] || 0;
            let correct = false;
            if (!this.titleGuessed && message.content.toLowerCase().includes(song.title.toLowerCase())) {
                score = score + 2;
                this.titleGuessed = true;
                correct = true;
                message.react('☑');
            }
            if (!this.artistGuessed && message.content.toLowerCase().includes(song.artist.toLowerCase())) {
                score = score + 3;
                this.artistGuessed = true;
                correct = true;
                message.react('☑');
            }
            this.scores[message.author.id] = score;
            if (this.titleGuessed && this.artistGuessed) {
                this.nextSong('Song guessed!');
            }
            if (!correct) {
                message.react('❌');
            }
        });
    }
    finish() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    nextSong(status) {
        const song = this.songs[this.currentSong];
        status += ` (${this.currentSong + 1}/${this.songs.length})\n`;
        status += `${song.title} by ${song.artist} \n`;
        status += `${song.link} \n\n`;
        status += this.getScores(this.message);
        this.message.say(status);
        if (this.currentSong + 1 === this.songs.length) {
            return this.finish;
        }
        this.currentSong++;
        this.musicStream.destroy();
        this.startPlaying();
    }
    getScores(message) {
        return message.member.voice.channel.members
            .filter(member => member.displayName !== "Musiq Quizzer")
            .map(member => `${member.nickname || member.displayName}: ${this.scores[member.id] || 0}`)
            .join('\n');
    }
    getSongs(playlist, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const spotify = new spotify_1.default();
            yield spotify.authorize();
            try {
                return (yield spotify.getPlaylist(playlist))
                    .filter(song => song.preview_url !== null)
                    .sort(() => Math.random() > 0.5 ? 1 : -1)
                    .filter((song, index) => index <= amount)
                    .map(song => ({
                    link: `https://open.spotify.com/track/${song.id}`,
                    previewUrl: song.preview_url,
                    title: this.stripSongName(song.name),
                    artist: (song.artists[0] || {}).name
                }));
            }
            catch (error) {
                console.log(error);
                this.message.say('Could not retrieve the playlist. Make sure it\'s public');
                return;
            }
        });
    }
    findSong(song) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.youtube.search(`${song.title} - ${song.artist}`, 1, { type: 'video', videoCategoryId: 10 });
            return (_a = result[0]) === null || _a === void 0 ? void 0 : _a.url;
        });
    }
    /**
     * Will remove all excess from the song names
     * Examples:
     * death bed (coffee for your head) (feat. beabadoobee) -> death bed
     * Dragostea Din Tei - DJ Ross Radio Remix -> Dragostea Din Tei
     *
     * @param name string
     */
    stripSongName(name) {
        return name.replace(/ \(.*\)/g, '')
            .replace(/ - .*$/, '');
    }
}
exports.MusicQuiz = MusicQuiz;
//# sourceMappingURL=music-quiz.js.map