<script>
	import { t } from 'svelte-i18n';
	import { bezier } from '$lib/helpers/easing';
	import { fly } from '$lib/helpers/transition';
	import { data } from '$lib/data/characters.json';
	import { isMobileLandscape, liteMode } from '$lib/stores/app-store';
	import positionToStyle from '$lib/helpers/css-transformer';
	import { assetPath } from '$lib/helpers/assets';
	import BannerTpl from './__banner-tpl.svelte';

	export let item = {};

	let hideOverflow = false;
	const characterOffset = (characterName, ismobile) => {
		const nullValue = { bannerOffset: {} };
		const { bannerOffset } = data.find(({ name }) => name === characterName) || nullValue;
		hideOverflow = bannerOffset?.o == 'hide';
		if (!ismobile) return positionToStyle(bannerOffset);

		const tmp = {};
		tmp.b = (bannerOffset?.b || 0) + 87;
		tmp.l = (bannerOffset?.l || 0) + 3;

		return positionToStyle({ ...bannerOffset, ...tmp });
	};

	$: offset = characterOffset(item.featured, $isMobileLandscape);
</script>

<BannerTpl>
	<div class="content" class:lite={$liteMode}>
		<div class="featured-bg" />
		<div class="overflow" class:hide={hideOverflow}>
			<div class="splash-art">
				<div class="wrapper">
					<div
						class="art-pic"
						in:fly={{
							x: -40,
							duration: 4000,
							delay: 250,
							opacity: 1,
							easing: bezier(0.13, 0.14, 0, 1)
						}}
					>
						<picture style={offset}>
							<source
								srcset={assetPath(`splash-art/5/${item.featured}`, 2000)}
								media="(min-width: 1280px)"
							/>
							<source
								srcset={assetPath(`splash-art/5/${item.featured}`, 1280)}
								media="(min-width: 640px)"
							/>
							<img
								crossorigin="anonymous"
								alt={$t(item.featured)}
								src={assetPath(`splash-art/5/${item.featured}`, 640)}
							/>
						</picture>
					</div>
				</div>
			</div>
		</div>
	</div>
</BannerTpl>

<style>
	.content {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.featured-bg {
		width: 100%;
		height: 100%;
		z-index: -1;
		mask-image: linear-gradient(black 85%, transparent);
		background-image: linear-gradient(
			170deg,
			rgb(0, 0, 0, 1),
			var(--bn-color1) 50%,
			var(--bn-color2)
		);
		background-color: rgba(255, 255, 255, 0.5);
		background-size: 200%;
		background-position: top left;
		position: relative;
	}
	.overflow {
		width: 143%;
		height: 130%;
		position: absolute;
		top: 0;
		right: 0;
		z-index: -1;
	}
	.overflow.hide {
		overflow: hidden;
	}

	.splash-art {
		position: absolute;
		top: 0;
		right: 0;
		z-index: -1;
		width: 100%;
		height: 100%;
		transform: translateY(-20%);
	}

	.wrapper {
		display: block;
		width: 100%;
		height: 100%;
		mask-image: linear-gradient(black 75%, transparent 100%);
	}

	.lite .featured-bg,
	.lite .wrapper {
		mask-image: unset;
	}

	.lite {
		overflow: hidden;
	}
	.lite .featured-bg {
		background-image: unset;
		background-color: var(--bn-color1);
	}

	.art-pic {
		position: relative;
		display: block;
		height: 100%;
		width: 100%;
	}

	picture {
		position: absolute;
		display: block;
	}
	img {
		width: 100%;
	}

	:global(.mobileLandscape) .art-pic {
		bottom: -90%;
		left: -1.5%;
		transform: scale(0.9);
	}
</style>
