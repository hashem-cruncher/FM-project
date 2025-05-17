import Link from 'next/link';

const Hero = () => {
    return (
        <div className="relative bg-gradient-to-b from-blue-50 to-white py-20">
            <div className="container mx-auto px-4">
                <div className="text-center">
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">
                        مرحباً بك في عالم اللغة العربية! 🌟
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        تعلم وابتكر واستمتع في رحلة تعلم اللغة العربية 🎨
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/login"
                            className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition duration-300"
                        >
                            تسجيل الدخول
                        </Link>
                        <Link
                            href="/register"
                            className="bg-green-600 text-white px-8 py-3 rounded-full hover:bg-green-700 transition duration-300"
                        >
                            انضم إلينا
                        </Link>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path
                        fill="#ffffff"
                        fillOpacity="1"
                        d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    ></path>
                </svg>
            </div>
        </div>
    );
};

export default Hero; 