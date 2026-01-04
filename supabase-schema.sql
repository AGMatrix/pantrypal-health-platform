-- PantryPal Database Schema
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_data table
CREATE TABLE IF NOT EXISTS user_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    favorites TEXT[] DEFAULT '{}',
    shopping_list JSONB DEFAULT '[]'::jsonb,
    search_history TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ingredients JSONB DEFAULT '[]'::jsonb,
    instructions TEXT,
    nutrition JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diet_plans table
CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    health_conditions JSONB DEFAULT '[]'::jsonb,
    severity_levels JSONB DEFAULT '{}'::jsonb,
    current_medications JSONB DEFAULT '[]'::jsonb,
    allergens JSONB DEFAULT '[]'::jsonb,
    dietary_preferences JSONB DEFAULT '[]'::jsonb,
    goal_type TEXT NOT NULL DEFAULT 'maintenance',
    rare_condition_analysis JSONB,
    preferences JSONB DEFAULT '{}'::jsonb,
    restrictions JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    special_notes JSONB DEFAULT '[]'::jsonb,
    meal_prep_tips JSONB DEFAULT '[]'::jsonb,
    nutrition_guidelines TEXT,
    emergency_substitutions JSONB DEFAULT '[]'::jsonb,
    progress_tracking TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_plan_days table
CREATE TABLE IF NOT EXISTS meal_plan_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
    breakfast TEXT,
    lunch TEXT,
    dinner TEXT,
    snacks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(diet_plan_id, day_number)
);

-- Create shopping_list_categories table
CREATE TABLE IF NOT EXISTS shopping_list_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES shopping_list_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_purchased BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_active ON diet_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_diet_plan_id ON meal_plan_days(diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_shopping_categories_diet_plan_id ON shopping_list_categories(diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category_id ON shopping_list_items(category_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are intentionally permissive for this application
-- since we're using custom JWT authentication instead of Supabase Auth
-- In production, you may want to add more restrictive policies
