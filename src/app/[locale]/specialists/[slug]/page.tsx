export default async function SpecialistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-3xl font-bold mb-8">სპეციალისტი: {slug}</h1>
        <p>სპეციალისტის გვერდი მალე დაემატება...</p>
      </div>
    </div>
  );
}
