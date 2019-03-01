  <template>
    <div class="app">
           <el-input placeholder="Please input" v-model="input3">
    <template slot="prepend">Http://</template>
  </el-input>
  
        <el-table
        :data="tableData"
        style="width: 700">
        <el-table-column
            prop="date"
            label="Date"
            width="180">
        </el-table-column>
        <el-table-column
            prop="name"
            label="Name"
            width="180">
        </el-table-column>
        <el-table-column
            prop="address"
            label="Address">
        </el-table-column>
    </el-table>
    </div>
  </template>

  <script>
    export default {
      data() {
        return {
          tableData: [{
            date: '2016-05-03',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles'
          }, {
            date: '2016-05-02',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles'
          }, {
            date: '2016-05-04',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles'
          }, {
            date: '2016-05-01',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles'
          }]
        }
      }
    }
  </script>

  <style scope>
   .app {
       height: 400px;
   }
  </style>
  