import { Howl } from 'howler';
import { fetchAudio } from './audioFetcher';
import { activeBacksound, currentTime, musics } from '$lib/stores/phonograph-store';
import { cookie } from '$lib/stores/cookies';
import { localConfig } from '$lib/stores/localstorage';

let tracks = [];
musics.subscribe((val) => (tracks = val));

const rand = (array) => {
	const index = Math.floor(Math.random() * array.length);
	return { selected: array[index], index };
};

const loadedTracks = {};
const trackIDs = {};
let playedIndex = 0;

const nextTrack = (sourceID) => {
	loadedTracks[sourceID].stop();

	const isLoop = cookie.get('loopTrack');
	if (isLoop) {
		playTrack(sourceID);
		return;
	}

	const isSuffle = cookie.get('suffleTrack');
	if (isSuffle === undefined || isSuffle) return randomTrack();

	const nextIndex = playedIndex >= tracks.length ? 0 : playedIndex + 1;
	const trackData = tracks[nextIndex];
	playTrack(trackData.sourceID);
	playedIndex = nextIndex;
	activeBacksound.set(trackData);
};

let stopAfterFade = null;
const fadeTrack = (sourceID) => {
	if (loadedTracks[sourceID].playing()) {
		// stop Sound if its pllaying
		if (stopAfterFade) {
			loadedTracks[sourceID].stop();
			stopAfterFade = null;
			return;
		}
		return loadedTracks[sourceID].pause();
	}

	// play sound if fade in
	loadedTracks[sourceID].play();
};

const trackError = (sourceID) => {
	delete loadedTracks[sourceID];
	delete trackIDs[sourceID];
};

const afterPLay = (sourceID) => {
	const duration = loadedTracks[sourceID].duration();

	if (!duration) return;
	seekTrack(sourceID);
	musics.update((val) => {
		return val.map((m) => {
			if (m.sourceID !== sourceID) return m;
			m['duration'] = duration;
			return m;
		});
	});
};

const seekTrack = (sourceID) => {
	const pos = loadedTracks[sourceID].seek() || 0;
	currentTime.set(pos);
	// If the sound is still playing, continue stepping.
	if (loadedTracks[sourceID].playing()) {
		requestAnimationFrame(() => seekTrack(sourceID));
	}
};

export const playTrack = async (sourceID) => {
	const muted = localConfig.get('muted');
	if (muted) return { status: 'muted' };
	if (!sourceID) return { status: 'error' };

	cookie.set('trackID', sourceID);
	if (sourceID in loadedTracks) {
		trackIDs[sourceID] = loadedTracks[sourceID].play();
		return { status: 'ok' };
	}

	try {
		const trackURL = await fetchAudio(sourceID);
		let volume = cookie.get('trackVolume') || 0.2;
		loadedTracks[sourceID] = new Howl({
			src: [trackURL],
			html5: true,
			volume,
			onplayerror: () => trackError(sourceID),
			onplay: () => afterPLay(sourceID),
			onend: () => nextTrack(sourceID),
			onfade: () => fadeTrack(sourceID)
		});
		trackIDs[sourceID] = loadedTracks[sourceID].play();
		return { status: 'ok' };
	} catch (e) {
		return { status: 'error' };
	}
};

export const randomTrack = (mode = 'nav') => {
	const unfinisedTrack = cookie.get('trackID');
	if (unfinisedTrack && mode === 'init') {
		playedIndex = tracks.findIndex(({ sourceID }) => unfinisedTrack === sourceID);
		playTrack(unfinisedTrack);
		activeBacksound.set(tracks[playedIndex]);
		return;
	}
	const { selected, index } = rand(tracks);
	playedIndex = index;
	playTrack(selected.sourceID);
	activeBacksound.set(selected);
};

export const pauseTrack = (sourceID, stop = true) => {
	const muted = localConfig.get('muted');
	if (muted) return;

	stopAfterFade = stop;
	let volume = cookie.get('trackVolume') || 0.2;

	const sound = loadedTracks[sourceID];
	if (!sound) return;
	sound.fade(volume, 0, 1000, trackIDs[sourceID]);
};

export const resumeTrack = (sourceID) => {
	const muted = localConfig.get('muted');
	if (muted) return;

	let volume = cookie.get('trackVolume') || 0.2;

	const sound = loadedTracks[sourceID];
	if (!sound) return;
	sound.fade(0, volume, 1000, trackIDs[sourceID]);
};

export const isPlaying = (sourceID) => {
	const sound = loadedTracks[sourceID];
	if (!sound) return false;
	sound.playing(trackIDs[sourceID]);
};

export const formatTime = (secs) => {
	const minutes = Math.floor(secs / 60) || 0;
	const seconds = Math.floor(secs - minutes * 60) || 0;
	const duration = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
	return duration;
};