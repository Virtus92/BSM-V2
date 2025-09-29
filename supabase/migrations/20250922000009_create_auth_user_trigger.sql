-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile with default customer role
  INSERT INTO public.user_profiles (
    id,
    user_type,
    is_active,
    notifications_enabled,
    language,
    timezone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    true,
    true,
    COALESCE(NEW.raw_user_meta_data->>'language', 'de'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Europe/Berlin'),
    NOW(),
    NOW()
  );

  -- If user type is customer, create customer record
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer') = 'customer' THEN
    INSERT INTO public.customers (
      user_id,
      company_name,
      contact_person,
      email,
      status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'New Customer'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'active',
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;