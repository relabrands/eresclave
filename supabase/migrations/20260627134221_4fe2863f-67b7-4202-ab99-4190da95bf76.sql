
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Donations
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  donor_email text,
  donor_phone text,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  donation_type text NOT NULL DEFAULT 'monetary',
  child_id uuid,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.donations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create donation intent" ON public.donations
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view donations" ON public.donations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update donations" ON public.donations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete donations" ON public.donations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Drop-off centers
CREATE TABLE public.drop_off_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Las Charcas',
  hours text,
  phone text,
  contact_person text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drop_off_centers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.drop_off_centers TO authenticated;
GRANT ALL ON public.drop_off_centers TO service_role;
ALTER TABLE public.drop_off_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active centers" ON public.drop_off_centers
  FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage centers" ON public.drop_off_centers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sponsorship children
CREATE TABLE public.sponsorship_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age int,
  story text,
  monthly_amount numeric(10,2) NOT NULL DEFAULT 500,
  photo_url text,
  sponsored boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sponsorship_children TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sponsorship_children TO authenticated;
GRANT ALL ON public.sponsorship_children TO service_role;
ALTER TABLE public.sponsorship_children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active children" ON public.sponsorship_children
  FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage children" ON public.sponsorship_children
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Site content
CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads content" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage content" ON public.site_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed initial content
INSERT INTO public.site_content (key, value) VALUES
  ('hero', '{"badge":"Iniciativa juvenil de Las Charcas","title":"Impulsa a la juventud de Las Charcas","subtitle":"Una iniciativa de Robinson Sánchez para que ningún joven de nuestra comunidad se quede sin oportunidades, sin útiles y sin alguien que crea en él.","primaryCta":"Donar útiles","secondaryCta":"Conocer la iniciativa"}'::jsonb),
  ('about', '{"title":"Sobre Eres Clave","intro":"Nacimos en Las Charcas con una idea simple: ningún joven debería detener sus sueños por falta de un cuaderno, una mochila o alguien que le diga que puede lograrlo.","pillars":[{"title":"Comunidad","desc":"Vecinos, familias y voluntarios trabajando juntos por nuestros jóvenes."},{"title":"Propósito","desc":"Acompañamos a cada joven para que descubra su potencial."},{"title":"Impacto","desc":"Útiles, becas y acompañamiento que cambian historias reales."}]}'::jsonb),
  ('stats', '{"items":[{"value":"150+","label":"Jóvenes apoyados"},{"value":"300+","label":"Útiles entregados"},{"value":"8","label":"Comunidades alcanzadas"},{"value":"95%","label":"Continúan estudiando"}]}'::jsonb),
  ('founder', '{"name":"Robinson Sánchez","title":"Fundador de Eres Clave","quote":"Crecí en Las Charcas. Sé lo que significa querer estudiar y no tener con qué. Por eso esta iniciativa existe — porque tú eres clave, y nadie debería caminar solo."}'::jsonb);

INSERT INTO public.drop_off_centers (name, address, hours, phone, contact_person) VALUES
  ('Centro Comunal Las Charcas', 'Calle Principal #45, Las Charcas', 'Lun a Vie · 9:00am - 5:00pm', '(829) 740-4861', 'Carmen Pérez'),
  ('Iglesia Espíritu Santo', 'Av. Duarte esq. Mella, Las Charcas', 'Mar y Jue · 4:00pm - 7:00pm · Dom · 10:00am - 1:00pm', '(829) 740-4861', 'P. Luis Martínez'),
  ('Colmado Doña Yolanda', 'Calle 27 de Febrero #12, Las Charcas', 'Lun a Sáb · 8:00am - 8:00pm', '(829) 740-4861', 'Yolanda Reyes');

INSERT INTO public.sponsorship_children (name, age, story, monthly_amount) VALUES
  ('Mateo', 9, 'Sueña con ser ingeniero. Le faltan útiles para empezar 4to grado.', 500),
  ('Sofía', 12, 'Primera de su clase. Necesita libros para entrar a la secundaria.', 750),
  ('Andrés', 14, 'Quiere estudiar mecánica. Apóyalo con materiales y uniforme.', 800);
