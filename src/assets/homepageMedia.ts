import heroProjectorLivingroom from './images/hero_projector_livingroom_1795013907299.webp';
import spotlightGlampCharger from './images/spotlight_glamp_charger_1795013907888.webp';
import spotlightShakerBerries from './images/spotlight_shaker_berries_1795013907850.webp';
import situationAfterGym from './images/situation_after_gym_1795013908118.webp';
import situationWorkDesk from './images/situation_work_desk_1795013909438.webp';
import situationRoadTrip from './images/situation_road_trip_1795013909765.webp';
import situationBedroomStars from './images/situation_bedroom_stars_1795013910081.webp';
import situationGamepadTv from './images/situation_gamepad_tv_1795013911129.webp';
import situationRobotVacuum from './images/situation_robot_vacuum_1795013911417.webp';
import categoryDigitalGear from './images/category_digital_gear_1795013912241.webp';
import categorySmartHome from './images/category_smart_home_1795013912194.webp';
import categoryTravelCamping from './images/category_travel_camping_1795013912127.webp';
import categoryBeautyHealth from './images/category_beauty_health_1795013913637.webp';

export const HOMEPAGE_MEDIA = {
  heroProjector: heroProjectorLivingroom,
  spotlightGlamp: spotlightGlampCharger,
  spotlightShaker: spotlightShakerBerries,
  situations: {
    afterGym: situationAfterGym,
    workDesk: situationWorkDesk,
    roadTrip: situationRoadTrip,
    bedroomStars: situationBedroomStars,
    gamepadTv: situationGamepadTv,
    robotVacuum: situationRobotVacuum,
  },
  categories: {
    digital: categoryDigitalGear,
    smartHome: categorySmartHome,
    travelCamping: categoryTravelCamping,
    beautyHealth: categoryBeautyHealth,
  },
} as const;
