import Image from 'next/image';

const teamMembers = [
    {
        name: 'سارة الزعبي',
        role: 'مطورة ومصممة تعليمية متخصصة في تعليم اللغة العربية للأطفال',
        image: '/team/sarah.jpg'
    },
    {
        name: 'ريم سمارة',
        role: 'مصممة تجربة المستخدم ومطورة محتوى تعليمي تفاعلي',
        image: '/team/reem.jpg'
    }
];

const Team = () => {
    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
                    من نحن؟ 👋
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                    {teamMembers.map((member, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition duration-300"
                        >
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 relative mb-4">
                                    <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-4xl">
                                        {member.name[0]}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {member.name}
                                </h3>
                                <p className="text-gray-600 text-center">
                                    {member.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-12 text-center text-gray-600 max-w-2xl mx-auto">
                    <p>
                        نحن فريق متخصص في تطوير المحتوى التعليمي التفاعلي، نسعى لجعل تعلم اللغة العربية تجربة ممتعة وسهلة لكل الأطفال.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Team; 