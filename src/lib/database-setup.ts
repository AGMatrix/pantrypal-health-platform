// src/lib/database-setup.ts
// Utility to set up database tables programmatically with RLS enabled

import { supabase } from './supabase';

export async function setupDatabaseTables(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🚀 Starting database setup...');

    // Check if tables already exist
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['diet_plans', 'meal_plan_days', 'shopping_list_categories', 'shopping_list_items']);

    if (checkError) {
      console.error('❌ Error checking existing tables:', checkError);
    } else {
      console.log('📋 Existing tables:', existingTables?.map(t => t.table_name));
    }

    // Create tables using raw SQL with RLS enabled
    const createTablesSQL = `
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

      -- Enable Row Level Security on all tables
      ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
      ALTER TABLE shopping_list_categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);
      CREATE INDEX IF NOT EXISTS idx_diet_plans_active ON diet_plans(is_active);
      CREATE INDEX IF NOT EXISTS idx_diet_plans_created_at ON diet_plans(created_at);
      CREATE INDEX IF NOT EXISTS idx_meal_plan_days_diet_plan_id ON meal_plan_days(diet_plan_id);
      CREATE INDEX IF NOT EXISTS idx_shopping_categories_diet_plan_id ON shopping_list_categories(diet_plan_id);
      CREATE INDEX IF NOT EXISTS idx_shopping_items_category_id ON shopping_list_items(category_id);
    `;

    console.log('📝 Executing table creation SQL...');
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });

    if (createError) {
      console.error('❌ Error creating tables:', createError);
      
      // Try alternative approach: create tables one by one
      console.log('🔄 Trying alternative table creation...');
      return await createTablesIndividually();
    }

    console.log('✅ Database tables created successfully');

    // Now create RLS policies
    await createRLSPolicies();

    // Verify tables were created
    const { data: finalTables, error: finalCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['diet_plans', 'meal_plan_days', 'shopping_list_categories', 'shopping_list_items']);

    if (finalCheckError) {
      console.warn('⚠️ Could not verify table creation:', finalCheckError);
    } else {
      console.log('✅ Verified tables:', finalTables?.map(t => t.table_name));
    }

    return {
      success: true,
      message: 'All database tables created successfully with RLS enabled',
      details: finalTables
    };

  } catch (error) {
    console.error('💥 Fatal error in database setup:', error);
    return {
      success: false,
      message: 'Failed to set up database tables',
      details: error
    };
  }
}

// Create RLS policies for all tables
async function createRLSPolicies(): Promise<void> {
  console.log('🔒 Creating RLS policies...');

  const rlsPoliciesSQL = `
    -- RLS policies for diet_plans
    CREATE POLICY IF NOT EXISTS "Users can view their own diet plans" ON public.diet_plans
        FOR SELECT USING (auth.uid()::text = user_id);

    CREATE POLICY IF NOT EXISTS "Users can insert their own diet plans" ON public.diet_plans
        FOR INSERT WITH CHECK (auth.uid()::text = user_id);

    CREATE POLICY IF NOT EXISTS "Users can update their own diet plans" ON public.diet_plans
        FOR UPDATE USING (auth.uid()::text = user_id);

    CREATE POLICY IF NOT EXISTS "Users can delete their own diet plans" ON public.diet_plans
        FOR DELETE USING (auth.uid()::text = user_id);

    -- RLS policies for meal_plan_days
    CREATE POLICY IF NOT EXISTS "Users can view their own meal plan days" ON public.meal_plan_days
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.diet_plans 
                WHERE diet_plans.id = meal_plan_days.diet_plan_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can insert meal plan days for their diet plans" ON public.meal_plan_days
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.diet_plans 
                WHERE diet_plans.id = meal_plan_days.diet_plan_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can update their own meal plan days" ON public.meal_plan_days
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.diet_plans 
                WHERE diet_plans.id = meal_plan_days.diet_plan_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can delete their own meal plan days" ON public.meal_plan_days
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.diet_plans 
                WHERE diet_plans.id = meal_plan_days.diet_plan_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    -- RLS policies for shopping_list_categories
    CREATE POLICY IF NOT EXISTS "Users can view their own shopping categories" ON public.shopping_list_categories
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.diet_plans 
                WHERE diet_plans.id = shopping_list_categories.diet_plan_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can insert shopping categories for their diet plans" ON public.shopping_list_categories
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.diet_plans 
                WHERE diet_plans.id = shopping_list_categories.diet_plan_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can update their own shopping categories" ON public.shopping_list_categories
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.diet_plans 
                WHERE diet_plans.id = shopping_list_categories.diet_plan_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can delete their own shopping categories" ON public.shopping_list_categories
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.diet_plans 
                WHERE diet_plans.id = shopping_list_categories.diet_plan_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    -- RLS policies for shopping_list_items
    CREATE POLICY IF NOT EXISTS "Users can view their own shopping items" ON public.shopping_list_items
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.shopping_list_categories 
                JOIN public.diet_plans ON diet_plans.id = shopping_list_categories.diet_plan_id
                WHERE shopping_list_categories.id = shopping_list_items.category_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can insert shopping items for their categories" ON public.shopping_list_items
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.shopping_list_categories 
                JOIN public.diet_plans ON diet_plans.id = shopping_list_categories.diet_plan_id
                WHERE shopping_list_categories.id = shopping_list_items.category_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can update their own shopping items" ON public.shopping_list_items
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.shopping_list_categories 
                JOIN public.diet_plans ON diet_plans.id = shopping_list_categories.diet_plan_id
                WHERE shopping_list_categories.id = shopping_list_items.category_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );

    CREATE POLICY IF NOT EXISTS "Users can delete their own shopping items" ON public.shopping_list_items
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.shopping_list_categories 
                JOIN public.diet_plans ON diet_plans.id = shopping_list_categories.diet_plan_id
                WHERE shopping_list_categories.id = shopping_list_items.category_id 
                AND diet_plans.user_id = auth.uid()::text
            )
        );
  `;

  const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsPoliciesSQL });
  
  if (rlsError) {
    console.error('❌ Error creating RLS policies:', rlsError);
  } else {
    console.log('✅ RLS policies created successfully');
  }
}

// Alternative approach: create tables individually
async function createTablesIndividually(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🔄 Creating tables individually...');

    // Create diet_plans table
    const dietPlansSQL = `
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
      ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
    `;

    const { error: dietPlansError } = await supabase.rpc('exec_sql', { sql: dietPlansSQL });
    if (dietPlansError) {
      console.error('❌ Error creating diet_plans table:', dietPlansError);
      throw dietPlansError;
    }
    console.log('✅ diet_plans table created with RLS enabled');

    // Create meal_plan_days table
    const mealPlanDaysSQL = `
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
      ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;
    `;

    const { error: mealPlanDaysError } = await supabase.rpc('exec_sql', { sql: mealPlanDaysSQL });
    if (mealPlanDaysError) {
      console.error('❌ Error creating meal_plan_days table:', mealPlanDaysError);
      throw mealPlanDaysError;
    }
    console.log('✅ meal_plan_days table created with RLS enabled');

    // Create shopping_list_categories table
    const shoppingCategoriesSQL = `
      CREATE TABLE IF NOT EXISTS shopping_list_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          order_index INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE shopping_list_categories ENABLE ROW LEVEL SECURITY;
    `;

    const { error: shoppingCategoriesError } = await supabase.rpc('exec_sql', { sql: shoppingCategoriesSQL });
    if (shoppingCategoriesError) {
      console.error('❌ Error creating shopping_list_categories table:', shoppingCategoriesError);
      throw shoppingCategoriesError;
    }
    console.log('✅ shopping_list_categories table created with RLS enabled');

    // Create shopping_list_items table
    const shoppingItemsSQL = `
      CREATE TABLE IF NOT EXISTS shopping_list_items (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          category_id UUID REFERENCES shopping_list_categories(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          order_index INTEGER DEFAULT 0,
          is_purchased BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
    `;

    const { error: shoppingItemsError } = await supabase.rpc('exec_sql', { sql: shoppingItemsSQL });
    if (shoppingItemsError) {
      console.error('❌ Error creating shopping_list_items table:', shoppingItemsError);
      throw shoppingItemsError;
    }
    console.log('✅ shopping_list_items table created with RLS enabled');

    // Create indexes
    const indexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_diet_plans_user_id ON diet_plans(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_diet_plans_active ON diet_plans(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_diet_plans_created_at ON diet_plans(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_meal_plan_days_diet_plan_id ON meal_plan_days(diet_plan_id);',
      'CREATE INDEX IF NOT EXISTS idx_shopping_categories_diet_plan_id ON shopping_list_categories(diet_plan_id);',
      'CREATE INDEX IF NOT EXISTS idx_shopping_items_category_id ON shopping_list_items(category_id);'
    ];

    for (const indexSQL of indexesSQL) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (indexError) {
        console.warn('⚠️ Error creating index:', indexError);
        // Continue with other indexes even if one fails
      }
    }
    console.log('✅ Database indexes created');

    // Create RLS policies
    await createRLSPolicies();

    return {
      success: true,
      message: 'All database tables created successfully using individual approach with RLS enabled'
    };

  } catch (error) {
    console.error('💥 Error in individual table creation:', error);
    return {
      success: false,
      message: 'Failed to create tables individually',
      details: error
    };
  }
}

// Helper function to check table exists
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

// Helper function to enable RLS on existing tables
export async function enableRLSOnExistingTables(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('🔒 Enabling RLS on existing tables...');

    const enableRLSSQL = `
      ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.meal_plan_days ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.shopping_list_categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    
    if (error) {
      throw error;
    }

    // Create RLS policies
    await createRLSPolicies();

    return {
      success: true,
      message: 'RLS enabled on all tables successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to enable RLS on tables',
    };
  }
}

// Helper function to drop all tables (for development/testing)
export async function dropAllTables(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const dropSQL = `
      DROP TABLE IF EXISTS shopping_list_items CASCADE;
      DROP TABLE IF EXISTS shopping_list_categories CASCADE;
      DROP TABLE IF EXISTS meal_plan_days CASCADE;
      DROP TABLE IF EXISTS diet_plans CASCADE;
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: dropSQL });
    
    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'All tables dropped successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to drop tables',
    };
  }
}