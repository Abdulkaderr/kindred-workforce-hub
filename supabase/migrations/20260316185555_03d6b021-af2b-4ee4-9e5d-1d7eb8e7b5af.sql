
DO $$
BEGIN
  -- correction_requests trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_correction_requests_updated_at') THEN
    CREATE TRIGGER update_correction_requests_updated_at
      BEFORE UPDATE ON public.correction_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- profiles trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- auth user created trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;
