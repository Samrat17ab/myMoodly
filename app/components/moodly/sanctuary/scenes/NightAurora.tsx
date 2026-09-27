import { Stars } from '../Stars';

/** Night: stars and a slow aurora over dark mountains. */
export function NightAurora() {
  return (
    <div className="mm-scene mm-scene--night">
      <Stars count={90} seed={23} maxY={68} />
      <span className="mm-shooting-star" />
      <span className="mm-aurora" />
      <span className="mm-aurora mm-aurora--soft" />
      <svg className="mm-scene__svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <path d="M0 720L120 650L220 690L340 600L430 650L520 610L640 680L760 620L860 670L980 600L1100 660L1220 620L1340 670L1440 640V900H0Z" fill="#0F2A31" />
        <path d="M340 600L362 626L352 628L376 642L400 650L382 630L366 616Z M980 600L1000 622L990 624L1014 638L1030 646L1012 626L996 612Z" fill="#4B6C72" opacity="0.6" />
        <path d="M0 780L160 740L300 770L460 730L620 770L780 740L940 776L1100 742L1260 772L1440 750V900H0Z" fill="#081B21" />
      </svg>
    </div>
  );
}
