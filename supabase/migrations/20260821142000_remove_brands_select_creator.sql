-- Remove the brands_select_creator policy which filters by created_by
-- This policy conflicts with the brands_select policy that uses brand_members
DROP POLICY IF EXISTS brands_select_creator ON onecite.brands;
