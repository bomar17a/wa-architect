-- Enable Row Level Security (RLS)
ALTER TABLE public.medical_schools ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated and anonymous users
CREATE POLICY "Enable read access for all users" ON public.medical_schools
    FOR SELECT
    USING (true);
