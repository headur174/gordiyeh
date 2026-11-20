import heroProjectorLivingroom from './images/hero_projector_livingroom_1795013907299.jpg';
import spotlightGlampCharger from './images/spotlight_glamp_charger_1795013907888.jpg';
import spotlightShakerBerries from './images/spotlight_shaker_berries_1795013907850.jpg';
import situationAfterGym from './images/situation_after_gym_1795013908118.jpg';
import situationWorkDesk from './images/situation_work_desk_1795013909438.jpg';
import situationRoadTrip from './images/situation_road_trip_1795013909765.jpg';
import situationBedroomStars from './images/situation_bedroom_stars_1795013910081.jpg';
import situationGamepadTv from './images/situation_gamepad_tv_1795013911129.jpg';
import situationRobotVacuum from './images/situation_robot_vacuum_1795013911417.jpg';
import categoryDigitalGear from './images/category_digital_gear_1795013912241.jpg';
import categorySmartHome from './images/category_smart_home_1795013912194.jpg';
import categoryTravelCamping from './images/category_travel_camping_1795013912127.jpg';
import categoryBeautyHealth from './images/category_beauty_health_1795013913637.jpg';

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
