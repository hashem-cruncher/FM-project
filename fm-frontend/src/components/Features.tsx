import { FaBook, FaGamepad, FaTrophy } from 'react-icons/fa';

const features = [
    {
        icon: <FaBook className="w-12 h-12 text-blue-600" />,
        title: 'دروس ممتعة',
        subtitle: 'تعلم مع الألعاب والقصص الشيقة',
        description: 'اكتشف عالماً من المغامرات مع شخصيات لطيفة تساعدك في تعلم اللغة العربية'
    },
    {
        icon: <FaGamepad className="w-12 h-12 text-green-600" />,
        title: 'ألعاب وتحديات',
        subtitle: 'العب وتعلم مع أصدقائك',
        description: 'حل الألغاز، اجمع النقاط، واربح الجوائز مع تمارين تفاعلية ممتعة'
    },
    {
        icon: <FaTrophy className="w-12 h-12 text-yellow-600" />,
        title: 'إنجازاتك',
        subtitle: 'اجمع النجوم والميداليات',
        description: 'شاهد تقدمك واحتفل بإنجازاتك مع شارات خاصة ومكافآت رائعة'
    }
];

const Features = () => {
    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="text-center p-6 rounded-xl hover:shadow-xl transition duration-300 border border-gray-100"
                        >
                            <div className="flex justify-center mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {feature.title}
                            </h3>
                            <h4 className="text-lg font-semibold text-gray-700 mb-3">
                                {feature.subtitle}
                            </h4>
                            <p className="text-gray-600">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features; 