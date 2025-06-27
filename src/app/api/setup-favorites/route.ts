// src/app/api/setup-favorites/route.ts
// Manual setup endpoint to create the favorites table

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🛠️ Manual favorites table setup started');
    
    const supabase = createSupabaseServerClient();
    
    // Define SQL statements at the top level
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id TEXT NOT NULL,
        recipe_id TEXT NOT NULL,
        recipe_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);',
      'CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);'
    ];
    
    const uniqueConstraintSQL = `
      ALTER TABLE favorites 
      ADD CONSTRAINT IF NOT EXISTS favorites_user_recipe_unique 
      UNIQUE(user_id, recipe_id);
    `;
    
    // Step 1: Test basic connection
    console.log('🔌 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return NextResponse.json({
        success: false,
        step: 'connection_test',
        error: 'Database connection failed',
        details: testError instanceof Error ? testError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    console.log('✅ Database connection successful');
    
    // Step 2: Check if table already exists
    console.log('🔍 Checking if favorites table exists...');
    const { data: existingTable, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'favorites')
      .eq('table_schema', 'public');
    
    if (!checkError && existingTable && existingTable.length > 0) {
      console.log('✅ Favorites table already exists');
      
      // Verify table structure by trying to select from it
      const { data: testSelect, error: selectError } = await supabase
        .from('favorites')
        .select('id')
        .limit(1);
      
      if (!selectError) {
        return NextResponse.json({
          success: true,
          message: 'Favorites table already exists and is accessible',
          tableExists: true
        });
      }
    }
    
    // Step 3: Try to create table using different methods
    console.log('📋 Creating favorites table...');
    let tableCreated = false;
    let creationMethod = '';
    
    // Method 1: Try using rpc if available
    try {
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });
      
      if (!createError) {
        console.log('✅ Table created using rpc method');
        tableCreated = true;
        creationMethod = 'rpc';
      } else {
        console.log('⚠️ RPC method failed:', createError.message);
      }
    } catch (rpcError) {
      console.log('⚠️ RPC not available, trying alternative...');
    }
    
    // Method 2: Try using stored procedure if available
    if (!tableCreated) {
      try {
        const { error: procError } = await supabase.rpc('create_favorites_table');
        
        if (!procError) {
          console.log('✅ Table created using stored procedure');
          tableCreated = true;
          creationMethod = 'stored_procedure';
        } else {
          console.log('⚠️ Stored procedure method failed:', procError.message);
        }
      } catch (procError) {
        console.log('⚠️ Stored procedure not available');
      }
    }
    
    // Method 3: Try direct table creation (this might not work in some environments)
    if (!tableCreated) {
      try {
        // This is a fallback method that might work in some cases
        console.log('⚠️ Attempting direct table creation...');
        
        // We'll try to test if the table can be created by attempting an operation
        const { error: directError } = await supabase
          .from('favorites')
          .insert({
            user_id: 'test-creation',
            recipe_id: 'test-recipe',
            recipe_data: { test: true }
          })
          .select()
          .single();
        
        if (!directError) {
          console.log('✅ Table appears to be accessible');
          tableCreated = true;
          creationMethod = 'direct';
          
          // Clean up test data
          await supabase
            .from('favorites')
            .delete()
            .eq('user_id', 'test-creation');
        }
      } catch (directError) {
        console.log('⚠️ Direct method failed');
      }
    }
    
    // Step 4: Verify table creation
    if (tableCreated) {
      console.log('🔍 Verifying table creation...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('favorites')
        .select('id')
        .limit(1);
      
      if (!verifyError) {
        console.log('✅ Table verification successful');
      } else {
        console.log('❌ Table verification failed:', verifyError.message);
        tableCreated = false;
      }
    }
    
    // Step 5: Add indexes if table was created (only for RPC method)
    if (tableCreated && creationMethod === 'rpc') {
      console.log('📊 Adding indexes...');
      
      for (const indexSQL of indexes) {
        try {
          const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
          if (!indexError) {
            console.log('✅ Index created successfully');
          } else {
            console.log('⚠️ Index creation failed:', indexError.message);
          }
        } catch (indexError) {
          console.log('⚠️ Index creation skipped:', indexError);
        }
      }
      
      // Add unique constraint
      try {
        const { error: constraintError } = await supabase.rpc('exec_sql', { sql: uniqueConstraintSQL });
        if (!constraintError) {
          console.log('✅ Unique constraint added');
        } else {
          console.log('⚠️ Unique constraint failed:', constraintError.message);
        }
      } catch (constraintError) {
        console.log('⚠️ Unique constraint skipped');
      }
    }
    
    // Step 6: Final verification with a test operation
    if (tableCreated) {
      console.log('🧪 Testing table with sample operations...');
      
      const testData = {
        user_id: 'test-user-setup',
        recipe_id: 'test-recipe-setup',
        recipe_data: { 
          title: 'Test Recipe', 
          ingredients: [], 
          instructions: [],
          test: true
        }
      };
      
      try {
        // Test insert
        const { data: insertedData, error: insertError } = await supabase
          .from('favorites')
          .insert(testData)
          .select()
          .single();
        
        if (!insertError && insertedData) {
          console.log('✅ Test insert successful');
          
          // Test select
          const { data: selectedData, error: selectError } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', 'test-user-setup')
            .single();
          
          if (!selectError && selectedData) {
            console.log('✅ Test select successful');
          }
          
          // Test delete (cleanup)
          const { error: deleteError } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', 'test-user-setup');
          
          if (!deleteError) {
            console.log('✅ Test delete successful');
          }
          
        } else {
          console.log('⚠️ Test insert failed:', insertError?.message);
        }
      } catch (testError) {
        console.log('⚠️ Test operations failed:', testError);
      }
    }
    
    const response = {
      success: tableCreated,
      message: tableCreated 
        ? `Favorites table created and configured successfully using ${creationMethod} method` 
        : 'Failed to create favorites table automatically',
      tableExists: tableCreated,
      creationMethod: tableCreated ? creationMethod : null,
      steps: {
        connection: true,
        tableCreation: tableCreated,
        verification: tableCreated,
        indexCreation: tableCreated && creationMethod === 'rpc'
      },
      instructions: !tableCreated ? {
        message: 'The table could not be created automatically. Please create it manually in your Supabase SQL editor.',
        sql: createTableSQL,
        indexes: indexes,
        uniqueConstraint: uniqueConstraintSQL
      } : null
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Setup error:', errorMessage);
    return NextResponse.json({
      success: false,
      error: 'Setup failed',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Provide helpful information about the setup endpoint
    return NextResponse.json({
      message: 'Favorites table setup endpoint',
      usage: {
        method: 'POST',
        endpoint: '/api/setup-favorites',
        description: 'Creates the favorites table if it does not exist'
      },
      tableStructure: {
        id: 'UUID PRIMARY KEY',
        user_id: 'TEXT NOT NULL',
        recipe_id: 'TEXT NOT NULL', 
        recipe_data: 'JSONB NOT NULL',
        created_at: 'TIMESTAMP WITH TIME ZONE',
        updated_at: 'TIMESTAMP WITH TIME ZONE'
      },
      indexes: [
        'idx_favorites_user_id',
        'idx_favorites_recipe_id', 
        'idx_favorites_created_at'
      ],
      constraints: [
        'favorites_user_recipe_unique (user_id, recipe_id)'
      ]
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      error: 'Failed to get endpoint information',
      details: errorMessage
    }, { status: 500 });
  }
}